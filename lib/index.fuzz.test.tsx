import { render } from '@testing-library/react'
import { Animations, Renderer } from '.'
import React, { useEffect, useState } from 'react'
import { v4 as uuid } from 'uuid'

import { test } from 'vitest'

test('fuzz', async () => {	  
	function App() {
		const [hues, setHues] = useState<{ id: string }[]>([
			{ id: uuid() }
		])

		useEffect(() => {
			const interval = setInterval(() => {
				setHues((oldHues) => {
					const newHues = oldHues.filter(() => Math.random() > 0.25)
					for (let i = 0; i <= newHues.length; i++) {
						if (Math.random() > 0.25) {
							newHues.splice(i, 0, {
								id: uuid(),
							})
							i++
						}
					}
					return newHues
				})
			}, 1)
			return () => clearInterval(interval)
		}, [])
	
		console.log(hues)
		const renderers: Renderer[] = hues.map(({ id }) => ({
			key: id,
			render: () => <div key={id}/>,
			duration: () => 10
		}))
	
		return <Animations renderers={renderers} />
	}

	render(<App/>)

	await new Promise(resolve => setTimeout(resolve, 2000))
})