<template>
  <div class="restocking">
    <!-- Page Header -->
    <div class="page-header">
      <h2>Restocking</h2>
      <p>Recommended restocking based on increasing demand forecasts</p>
    </div>

    <!-- Loading / Error states -->
    <div v-if="loading" class="loading">Loading...</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <div v-else>

      <!-- Budget Slider Card -->
      <div class="card budget-card">
        <div class="card-header">
          <h3 class="card-title">Available Budget</h3>
        </div>
        <div class="budget-slider-area">
          <div class="budget-labels">
            <span class="budget-label-min">{{ currencySymbol }}0</span>
            <span class="budget-label-current">{{ currencySymbol }}{{ budget.toLocaleString() }}</span>
            <span class="budget-label-max">{{ currencySymbol }}{{ Math.ceil(totalCost).toLocaleString() }}</span>
          </div>
          <input
            type="range"
            class="budget-slider"
            v-model.number="budget"
            :min="0"
            :max="Math.ceil(totalCost)"
            :step="100"
          />
          <p class="budget-hint">Slide to set your available budget. Items are prioritised by highest demand growth.</p>
        </div>
      </div>

      <!-- Summary Stats Row (3 cards) -->
      <div class="stats-grid">
        <div class="stat-card success">
          <div class="stat-label">Items to Restock</div>
          <div class="stat-value">{{ itemsInBudget.length }}</div>
        </div>
        <div class="stat-card info">
          <div class="stat-label">Total Cost</div>
          <div class="stat-value">{{ currencySymbol }}{{ Math.round(budgetedCost).toLocaleString() }}</div>
        </div>
        <div class="stat-card neutral">
          <div class="stat-label">Excluded</div>
          <div class="stat-value">{{ recommendedItems.length - itemsInBudget.length }}</div>
        </div>
      </div>

      <!-- Recommended Items Table -->
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">Recommended Items ({{ recommendedItems.length }})</h3>
        </div>
        <div v-if="recommendedItems.length === 0" class="empty-state">
          No items with increasing demand found for current filters.
        </div>
        <div v-else class="table-container">
          <table class="restocking-table">
            <thead>
              <tr>
                <th>SKU</th>
                <th>Item Name</th>
                <th>Current Demand</th>
                <th>Forecasted Demand</th>
                <th>Change</th>
                <th>Unit Cost</th>
                <th>Restock Qty</th>
                <th>Line Total</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="item in recommendedItems"
                :key="item.id"
                :class="{ 'row-excluded': !isItemInBudget(item) }"
              >
                <td class="col-sku">{{ item.item_sku }}</td>
                <td class="col-name">{{ item.item_name }}</td>
                <td class="col-num">{{ item.current_demand }}</td>
                <td class="col-num">{{ item.forecasted_demand }}</td>
                <td class="col-change" :style="{ color: item.change_pct > 0 ? '#10b981' : '#ef4444' }">
                  {{ formatChange(item.change_pct) }}
                </td>
                <td class="col-cost">
                  {{ currencySymbol }}{{ item.unit_cost.toFixed(2) }}
                  <span v-if="item._costEstimated" class="est-label">(est.)</span>
                </td>
                <td class="col-num">{{ item.forecasted_demand }}</td>
                <td class="col-total">{{ currencySymbol }}{{ Math.round(item.line_total).toLocaleString() }}</td>
                <td class="col-status">
                  <span v-if="isItemInBudget(item)" class="badge success">In Budget</span>
                  <span v-else class="badge neutral">Excluded</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Place Order Button + Success Banner -->
      <div class="order-action">
        <div v-if="orderPlaced" class="success-banner">
          Order RST placed successfully! Check the Orders tab for details.
        </div>
        <button
          class="btn btn-primary place-order-btn"
          :disabled="itemsInBudget.length === 0 || orderPlaced"
          @click="placeOrder"
        >
          {{ orderPlaced ? 'Order Placed!' : `Place Order (${itemsInBudget.length} items)` }}
        </button>
      </div>

    </div>
  </div>
</template>

<script>
import { ref, computed, watch, onMounted } from 'vue'
import { api } from '../api'
import { useFilters } from '../composables/useFilters'
import { useI18n } from '../composables/useI18n'
import { useRestockingOrders } from '../composables/useRestockingOrders'

export default {
  name: 'Restocking',
  setup() {
    const loading = ref(true)
    const error = ref(null)
    const allForecasts = ref([])
    const inventoryItems = ref([])
    const budget = ref(0)
    const orderPlaced = ref(false)

    const { selectedLocation, selectedCategory, getCurrentFilters } = useFilters()
    const { t, currentCurrency } = useI18n()
    const { submitOrder } = useRestockingOrders()

    const currencySymbol = computed(() => currentCurrency.value === 'JPY' ? '¥' : '$')

    // Data loading
    const loadData = async () => {
      try {
        loading.value = true
        error.value = null
        const filters = getCurrentFilters()
        const [forecasts, inventory] = await Promise.all([
          api.getDemandForecasts(),
          api.getInventory({ warehouse: filters.warehouse, category: filters.category })
        ])
        allForecasts.value = forecasts
        inventoryItems.value = inventory
      } catch (err) {
        error.value = 'Failed to load data: ' + err.message
      } finally {
        loading.value = false
      }
    }

    watch([selectedLocation, selectedCategory], loadData)
    onMounted(loadData)

    // Map for O(1) SKU lookup
    const inventoryBySku = computed(() => {
      const map = new Map()
      inventoryItems.value.forEach(inv => map.set(inv.sku, inv))
      return map
    })

    // Median unit_cost of all inventory items (robust against outliers)
    const fallbackCost = computed(() => {
      const costs = inventoryItems.value.map(i => i.unit_cost).sort((a, b) => a - b)
      if (!costs.length) return 50
      const mid = Math.floor(costs.length / 2)
      return costs.length % 2 === 0 ? (costs[mid - 1] + costs[mid]) / 2 : costs[mid]
    })

    // Increasing trend only, enriched with unit_cost, sorted by demand change % descending
    const recommendedItems = computed(() => {
      return allForecasts.value
        .filter(f => f.trend === 'increasing')
        .map(f => {
          const inv = inventoryBySku.value.get(f.item_sku)
          const unit_cost = inv ? inv.unit_cost : fallbackCost.value
          return {
            ...f,
            unit_cost,
            _costEstimated: !inv,
            line_total: unit_cost * f.forecasted_demand,
            change_pct: ((f.forecasted_demand - f.current_demand) / f.current_demand * 100)
          }
        })
        .sort((a, b) => b.change_pct - a.change_pct)
    })

    // Sum of all recommended items
    const totalCost = computed(() =>
      recommendedItems.value.reduce((s, i) => s + i.line_total, 0)
    )

    // Reset slider to full budget whenever items change (filter change or initial load)
    watch(recommendedItems, () => {
      budget.value = Math.ceil(totalCost.value)
    }, { immediate: true })

    // Greedy selection, highest change_pct first
    const itemsInBudget = computed(() => {
      let running = 0
      return recommendedItems.value.filter(item => {
        if (running + item.line_total <= budget.value) {
          running += item.line_total
          return true
        }
        return false
      })
    })

    // Total cost of selected items
    const budgetedCost = computed(() =>
      itemsInBudget.value.reduce((s, i) => s + i.line_total, 0)
    )

    const isItemInBudget = (item) => itemsInBudget.value.includes(item)

    const placeOrder = () => {
      if (!itemsInBudget.value.length) return
      submitOrder(itemsInBudget.value)
      orderPlaced.value = true
      setTimeout(() => { orderPlaced.value = false }, 3000)
    }

    const formatChange = (pct) => {
      const sign = pct > 0 ? '+' : ''
      return `${sign}${pct.toFixed(1)}%`
    }

    return {
      loading,
      error,
      budget,
      totalCost,
      orderPlaced,
      recommendedItems,
      itemsInBudget,
      budgetedCost,
      isItemInBudget,
      currencySymbol,
      placeOrder,
      formatChange,
      t
    }
  }
}
</script>

<style scoped>
.restocking { padding: 1.5rem 2rem; }

.page-header { margin-bottom: 1.5rem; }
.page-header h2 { font-size: 1.5rem; font-weight: 700; color: #f1f5f9; }
.page-header p { color: #64748b; margin-top: 0.25rem; font-size: 0.9rem; }

.loading, .error { padding: 2rem; text-align: center; color: #64748b; }
.error { color: #ef4444; }

.card {
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 0.75rem;
  margin-bottom: 1.25rem;
}
.card-header {
  padding: 1rem 1.25rem;
  border-bottom: 1px solid #334155;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.card-title { font-size: 0.95rem; font-weight: 600; color: #e2e8f0; }

/* Budget slider */
.budget-card .budget-slider-area { padding: 1.25rem 1.5rem 1.5rem; }
.budget-labels {
  display: flex;
  justify-content: space-between;
  font-size: 0.8rem;
  color: #94a3b8;
  margin-bottom: 0.5rem;
}
.budget-label-current {
  font-size: 1.25rem;
  font-weight: 700;
  color: #f1f5f9;
}
.budget-slider {
  width: 100%;
  height: 6px;
  accent-color: #3b82f6;
  cursor: pointer;
  margin-bottom: 0.5rem;
}
.budget-hint { font-size: 0.78rem; color: #475569; }

/* Stats grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin-bottom: 1.25rem;
}
.stat-card {
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 0.75rem;
  padding: 1rem 1.25rem;
}
.stat-card.success { border-left: 4px solid #10b981; }
.stat-card.info    { border-left: 4px solid #3b82f6; }
.stat-card.neutral { border-left: 4px solid #475569; }
.stat-label { font-size: 0.78rem; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.25rem; }
.stat-value { font-size: 1.5rem; font-weight: 700; color: #f1f5f9; }

/* Table */
.table-container { overflow-x: auto; }
.restocking-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.84rem;
}
.restocking-table th {
  padding: 0.625rem 1rem;
  text-align: left;
  font-size: 0.75rem;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  background: #0f172a;
  border-bottom: 1px solid #334155;
}
.restocking-table td {
  padding: 0.75rem 1rem;
  color: #94a3b8;
  border-bottom: 1px solid #1e293b;
}
.restocking-table tr:last-child td { border-bottom: none; }
.col-sku   { font-family: monospace; color: #e2e8f0 !important; }
.col-name  { color: #e2e8f0 !important; }
.col-num   { text-align: right; }
.col-change { text-align: right; font-weight: 600; }
.col-cost  { text-align: right; }
.col-total { text-align: right; font-weight: 600; color: #e2e8f0 !important; }
.col-status { text-align: center; }

.row-excluded { opacity: 0.45; }

.est-label { font-size: 0.7rem; color: #64748b; margin-left: 2px; }

/* Badges */
.badge {
  display: inline-block;
  padding: 0.2rem 0.5rem;
  border-radius: 9999px;
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.03em;
}
.badge.success { background: #14532d; color: #4ade80; }
.badge.neutral { background: #1e293b; color: #475569; border: 1px solid #334155; }

/* Empty state */
.empty-state {
  padding: 2.5rem;
  text-align: center;
  color: #475569;
  font-size: 0.9rem;
}

/* Place Order area */
.order-action {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.75rem;
  margin-top: 0.5rem;
  margin-bottom: 2rem;
}

.success-banner {
  background: #14532d;
  border: 1px solid #16a34a;
  color: #4ade80;
  padding: 0.625rem 1.25rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
}

.btn {
  padding: 0.625rem 1.5rem;
  border-radius: 0.5rem;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  border: none;
  transition: background 0.15s;
}
.btn-primary {
  background: #3b82f6;
  color: #fff;
}
.btn-primary:hover:not(:disabled) { background: #2563eb; }
.btn-primary:disabled {
  background: #1e3a5f;
  color: #475569;
  cursor: not-allowed;
}

.place-order-btn { min-width: 200px; }
</style>
