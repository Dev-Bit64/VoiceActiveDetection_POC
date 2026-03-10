import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import VoiceTimelinePOC from './VoiceTimeStamp'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <VoiceTimelinePOC />
    </>
  )
}

export default App
