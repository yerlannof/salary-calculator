'use client'

import { Card } from '@/components/ui/card'

interface StoreData {
  storeId: string
  storeName: string
  sales: number
  salesCount: number
  returns: number
  returnsCount: number
  netSales: number
}

interface SalesByStoreProps {
  stores: StoreData[]
}

export function SalesByStore({ stores }: SalesByStoreProps) {
  if (!stores || stores.length === 0) {
    return null
  }

  // Общие итоги
  const totals = stores.reduce(
    (acc, store) => ({
      sales: acc.sales + store.sales,
      salesCount: acc.salesCount + store.salesCount,
      returns: acc.returns + store.returns,
      returnsCount: acc.returnsCount + store.returnsCount,
      netSales: acc.netSales + store.netSales,
    }),
    { sales: 0, salesCount: 0, returns: 0, returnsCount: 0, netSales: 0 }
  )

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <span className="text-2xl">🏪</span>
        Продажи по магазинам
      </h3>

      <div className="space-y-4">
        {stores.map((store) => {
          const returnRate = store.sales > 0 ? (store.returns / store.sales) * 100 : 0

          return (
            <div
              key={store.storeId}
              className="border border-border/50 rounded-lg p-4 hover:bg-accent/5 transition-colors"
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h4 className="font-semibold text-base">{store.storeName}</h4>
                  <p className="text-sm text-muted-foreground">
                    {store.salesCount} {store.salesCount === 1 ? 'чек' : 'чеков'}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-green-600 dark:text-green-400">
                    {store.netSales.toLocaleString('ru-RU')} ₸
                  </div>
                  <div className="text-xs text-muted-foreground">чистые</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Продажи:</span>
                    <span className="font-medium">
                      {store.sales.toLocaleString('ru-RU')} ₸
                    </span>
                  </div>
                  {store.returns > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Возвраты:</span>
                      <span className="font-medium text-red-600 dark:text-red-400">
                        -{store.returns.toLocaleString('ru-RU')} ₸
                      </span>
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  {store.returnsCount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">% возвратов:</span>
                      <span className={`font-medium ${returnRate > 10 ? 'text-red-600 dark:text-red-400' : 'text-orange-600 dark:text-orange-400'}`}>
                        {returnRate.toFixed(1)}%
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Средний чек:</span>
                    <span className="font-medium">
                      {Math.round(store.sales / store.salesCount).toLocaleString('ru-RU')} ₸
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )
        })}

        {/* Итоговая панель */}
        {stores.length > 1 && (
          <div className="border-t-2 border-border pt-4 mt-4">
            <div className="bg-accent/10 rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-bold text-base">Итого по всем магазинам</h4>
                <div className="text-right">
                  <div className="text-xl font-bold text-green-600 dark:text-green-400">
                    {totals.netSales.toLocaleString('ru-RU')} ₸
                  </div>
                  <div className="text-xs text-muted-foreground">чистые продажи</div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-sm text-muted-foreground">
                <div>Продажи: {totals.sales.toLocaleString('ru-RU')} ₸</div>
                <div>Возвраты: {totals.returns.toLocaleString('ru-RU')} ₸</div>
                <div>Чеков: {totals.salesCount}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}
