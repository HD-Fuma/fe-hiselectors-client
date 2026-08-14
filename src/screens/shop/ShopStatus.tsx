type ShopStatusProps = {
  status: string | null
}

export default function ShopStatus({ status }: ShopStatusProps) {
  if (!status) {
    return null
  }

  return <p className="shop-status" role="status">{status}</p>
}
