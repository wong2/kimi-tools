import { DEFAULT_PROMPT, loadCustomPrompt, setCustomPrompt } from '@/services/prompt'
import { Card, CardActions, CardContent, Checkbox, Chip, Divider, Link, Snackbar, Textarea, Typography } from '@mui/joy'
import Button from '@mui/joy/Button'
import { useEffect, useState } from 'react'

export default function App() {
  const [prompt, setPrompt] = useState<string | null>(null)
  const [showToast, setShowToast] = useState(false)

  const reset = () => {
    setPrompt(DEFAULT_PROMPT)
  }

  const save = async () => {
    if (!prompt) {
      return
    }
    if (prompt === DEFAULT_PROMPT) {
      await setCustomPrompt('')
    } else {
      await setCustomPrompt(prompt)
    }
    setShowToast(true)
  }

  useEffect(() => {
    loadCustomPrompt().then((p) => {
      setPrompt(p || DEFAULT_PROMPT)
    })
  }, [])

  if (prompt === null) {
    return null
  }

  return (
    <div className="max-w-[500px] mx-auto">
      <Card>
        <Typography level="title-lg">选项</Typography>
        <Divider inset="none" />
        <CardContent>
          <div className="flex flex-row items-center justify-between mb-1">
            <Typography level="title-md">Prompt</Typography>
            {prompt !== DEFAULT_PROMPT && (
              <Chip variant="soft" size="sm" sx={{ px: 1 }} onClick={reset}>
                恢复默认
              </Chip>
            )}
          </div>
          <Textarea value={prompt} size="sm" minRows={3} onChange={(e) => setPrompt(e.target.value)}></Textarea>
        </CardContent>
        <CardActions>
          <Button onClick={save}>保存</Button>
        </CardActions>
      </Card>
      <Snackbar
        open={showToast}
        onClose={() => setShowToast(false)}
        autoHideDuration={1000}
        color="success"
        variant="plain"
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        保存成功
      </Snackbar>
    </div>
  )
}
