import { ref } from 'vue'

// Module-scope singleton — persists across component remounts (same pattern as useFilters.js)
const submittedOrders = ref([])
let orderCounter = 0

export function useRestockingOrders() {
  const submitOrder = (selectedItems) => {
    orderCounter++
    const orderDate = new Date()
    const deliveryDate = new Date(orderDate)
    // Fixed 14-day lead time for all restocking orders
    deliveryDate.setDate(deliveryDate.getDate() + 14)

    const order = {
      id: `RST-${Date.now()}`,
      order_number: `RST-${String(orderCounter).padStart(3, '0')}`,
      customer: 'Internal Restocking',
      items: selectedItems.map(item => ({
        sku: item.item_sku,
        name: item.item_name,
        quantity: item.forecasted_demand,
        unit_price: item.unit_cost
      })),
      status: 'Processing',
      order_date: orderDate.toISOString(),
      expected_delivery: deliveryDate.toISOString(),
      total_value: Math.round(
        selectedItems.reduce((s, i) => s + i.forecasted_demand * i.unit_cost, 0) * 100
      ) / 100,
      _isRestocking: true
    }

    submittedOrders.value.unshift(order)
    return order
  }

  return { submittedOrders, submitOrder }
}
