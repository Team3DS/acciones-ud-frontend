export interface ReportTransaction { id: string; orderId: string; symbol: string; date: string; timestamp: string; side: 'Compra' | 'Venta'; quantity: string; price: string; grossMicros: bigint }
export interface ReportFee { id: string; orderId: string; symbol: string; date: string; type: string; description: string; netMicros: bigint }
export interface ReportData { transactions: ReportTransaction[]; fees: ReportFee[]; excluded: number }
