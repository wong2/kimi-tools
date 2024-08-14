import { FC, PropsWithChildren, useEffect, useState } from 'react'

export const Link: FC<PropsWithChildren<{ href?: string; onClick?: () => void }>> = (props) => {
  const onClick = () => {
    if (props.href) {
      browser.tabs.create({ url: props.href })
    } else if (props.onClick) {
      props.onClick()
    }
  }
  return (
    <span className="text-blue-500 text-sm mt-3 font-medium block cursor-pointer" onClick={onClick}>
      {props.children}
    </span>
  )
}

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
    return <Link href="https://buymeacoffee.com/wong2">请杯咖啡</Link>
  }

  return (
    <Link href="https://chromewebstore.google.com/detail/kimi-copilot/icmdpfpmbfijfllafmfogmdabhijlehn/reviews">
      给个好评
    </Link>
  )
}
