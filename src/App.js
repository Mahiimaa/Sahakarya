import React, {useEffect, useState} from 'react'

function App() {
  const [data, setData] = useState([{}]);

  useEffect(() => {
    fetch("/api").then(
      (response) => response.json()
    ).then(
      (data) => {
        setData(data);
      }
    )
  }, []);

  return (
    <div className='text-emerald-500'>App</div>
  )
}

export default App