import { FC, PropsWithChildren, useEffect, useState } from 'react'

export const Link: FC<PropsWithChildren<{ href: string }>> = ({ href, children }) => (
  <span
    className="text-blue-500 text-sm mt-3 font-medium block cursor-pointer"
    onClick={() => browser.tabs.create({ url: href })}
  >
    {children}
  </span>
)

export const RatingLink: FC = () => {
  const [show, setShow] = useState(false)

  useEffect(() => {
    storage.getItem<number>('local:open_times').then((value) => {
      const openTimes = (value || 0) + 1
      storage.setItem('local:open_times', openTimes)
      if (openTimes === 3) {
        setShow(true)
      }
    })
  }, [])

  if (!show) {
    return <Link href="https://chromewebstore.google.com/detail/icmdpfpmbfijfllafmfogmdabhijlehn/support">反馈</Link>
  }

  return (
    <Link href="https://chromewebstore.google.com/detail/kimi-copilot/icmdpfpmbfijfllafmfogmdabhijlehn/reviews">
      给个好评
    </Link>
  )
}
