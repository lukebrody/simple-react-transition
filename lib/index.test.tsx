import { render, screen } from '@testing-library/react'
import { Animations, Renderer } from '.'
import React from 'react'

import { expect, test } from 'vitest'

test('add remove', async () => {

	let renderers: Renderer[] = [
		{
			key: '1',
			duration: () => 100,
			render: stage => <div key='1'>{stage}</div>
		}
	]

	const { rerender } = render(<Animations renderers={renderers} />)

	expect(screen.getByText('stable')).toBeInTheDocument()

	renderers = renderers.concat([
		{
			key: '2',
			duration: () => 100,
			render: stage => <div key='2'>{stage}</div>
		}
	])

	rerender(<Animations renderers={renderers} />)

	expect(screen.getByText('mount')).toBeInTheDocument()

	await new Promise(resolve => setTimeout(resolve, 10))

	expect(screen.getByText('add')).toBeInTheDocument()

	await new Promise(resolve => setTimeout(resolve, 100))

	expect(screen.getAllByText('stable').length).toBe(2)

	renderers = renderers.filter(renderer => renderer.key !== '1')

	rerender(<Animations renderers={renderers} />)

	await new Promise(resolve => setTimeout(resolve, 10))

	expect(screen.getByText('remove')).toBeInTheDocument()

	await new Promise(resolve => setTimeout(resolve, 100))

	expect(screen.queryByText('remove')).toBe(null)

	expect(screen.getAllByText('stable').length).toBe(1)
})

test('swap', async () => {

	let renderers: Renderer[] = [
		{
			key: '1',
			duration: () => 100,
			render: stage => <div key='1'>{stage}</div>
		}
	]

	const { rerender, container } = render(<Animations renderers={renderers} />)

	const observer = new MutationObserver(() => {
		expect(screen.queryByText('stable') !== null || container.children.length > 1).toBe(true)
	})

	observer.observe(container, { childList: true })

	expect(screen.getByText('stable')).toBeInTheDocument()

	renderers = [
		{
			key: '2',
			duration: () => 100,
			render: stage => <div key='2'>{stage}</div>
		}
	]

	rerender(<Animations renderers={renderers} />)

	expect(screen.getByText('mount')).toBeInTheDocument()
	expect(screen.getByText('remove')).toBeInTheDocument()

	await new Promise(resolve => setTimeout(resolve, 10))

	expect(screen.getByText('add')).toBeInTheDocument()
	expect(screen.getByText('remove')).toBeInTheDocument()

	await new Promise(resolve => setTimeout(resolve, 100))

	expect(screen.getAllByText('stable').length).toBe(1)
	expect(screen.queryByText('remove')).toBe(null)

	observer.disconnect()
})

test('remove during add', async () => {

	let renderers: Renderer[] = []

	const { rerender, container } = render(<Animations renderers={renderers} />)

	renderers = [
		{
			key: '1',
			duration: () => 100,
			render: stage => <div key='1'>{stage}</div>
		}
	]

	rerender(<Animations renderers={renderers} />)

	expect(screen.getByText('mount')).toBeInTheDocument()

	await new Promise(resolve => setTimeout(resolve, 10))

	expect(screen.getByText('add')).toBeInTheDocument()

	renderers = []

	rerender(<Animations renderers={renderers} />)

	expect(screen.getByText('remove')).toBeInTheDocument()

	await new Promise(resolve => setTimeout(resolve, 110))

	expect(screen.queryByText('remove')).toBe(null)
	expect(container.children.length).toBe(0)
})

test('add during remove', async () => {

	let renderers: Renderer[] = [
		{
			key: '1',
			duration: () => 100,
			render: stage => <div key='1'>{stage}</div>
		}
	]

	const { rerender, container } = render(<Animations renderers={renderers} />)

	renderers = []

	rerender(<Animations renderers={renderers} />)

	expect(screen.getByText('remove')).toBeInTheDocument()
	expect(container.children.length).toBe(1)

	renderers = [
		{
			key: '1',
			duration: () => 100,
			render: stage => <div key='1'>{stage}2</div>
		}
	]

	rerender(<Animations renderers={renderers} />)

	expect(screen.getByText('mount2')).toBeInTheDocument()
	expect(container.children.length).toBe(1)

	await new Promise(resolve => setTimeout(resolve, 10))

	expect(screen.getByText('add2')).toBeInTheDocument()


	await new Promise(resolve => setTimeout(resolve, 110))

	expect(screen.getByText('stable2')).toBeInTheDocument()
	expect(container.children.length).toBe(1)
})

test('many removals', () => {
	let renderers: Renderer[] = [
		{
			key: '1',
			duration: () => 100,
			render: stage => <div key='1'>{stage}</div>
		},
		{
			key: '2',
			duration: () => 100,
			render: stage => <div key='2'>{stage}</div>
		},
		{
			key: '3',
			duration: () => 100,
			render: stage => <div key='3'>{stage}</div>
		},
		{
			key: '4',
			duration: () => 100,
			render: stage => <div key='4'>{stage}</div>
		},
	]

	const { rerender } = render(<Animations renderers={renderers} />)

	renderers = [
		{
			key: '2',
			duration: () => 100,
			render: stage => <div key='2'>{stage}</div>
		},
		{
			key: '3',
			duration: () => 100,
			render: stage => <div key='3'>{stage}</div>
		},
	]

	rerender(<Animations renderers={renderers} />)
})

test('replace first', () => {
	let renderers: Renderer[] = [
		{
			key: '1',
			duration: () => 100,
			render: stage => <div key='1'>{stage}</div>
		},
		{
			key: '2',
			duration: () => 100,
			render: stage => <div key='2'>{stage}</div>
		},
	]

	const { rerender } = render(<Animations renderers={renderers} />)

	renderers = [
		{
			key: '3',
			duration: () => 100,
			render: stage => <div key='3'>{stage}</div>
		},
		{
			key: '2',
			duration: () => 100,
			render: stage => <div key='2'>{stage}</div>
		},
	]

	rerender(<Animations renderers={renderers} />)
})

test('replace then add two', () => {
	let renderers: Renderer[] = [
		{
			key: '1',
			duration: () => 100,
			render: stage => <div key='1'>{stage}</div>
		},
	]

	const { rerender } = render(<Animations renderers={renderers} />)

	renderers = [
		{
			key: '2',
			duration: () => 100,
			render: stage => <div key='2'>{stage}</div>
		},
	]

	rerender(<Animations renderers={renderers} />)

	renderers = [
		{
			key: '0',
			duration: () => 100,
			render: stage => <div key='0'>{stage}</div>
		},
		{
			key: '2',
			duration: () => 100,
			render: stage => <div key='2'>{stage}</div>
		},
		{
			key: '3',
			duration: () => 100,
			render: stage => <div key='3'>{stage}</div>
		},
	]

	rerender(<Animations renderers={renderers} />)
})

test('add one replace first', () => {

	let renderers: Renderer[] = [
		{
			key: 'a',
			duration: () => 100,
			render: stage => <div key='a'>{stage}</div>
		},
	]

	const { rerender } = render(<Animations renderers={renderers} />)

	renderers = [
		{
			key: '1',
			duration: () => 100,
			render: stage => <div key='1'>{stage}</div>
		},
		{
			key: '2',
			duration: () => 100,
			render: stage => <div key='2'>{stage}</div>
		},
	]

	rerender(<Animations renderers={renderers} />)

	renderers = [
		{
			key: '3',
			duration: () => 100,
			render: stage => <div key='3'>{stage}</div>
		},
		{
			key: '2',
			duration: () => 100,
			render: stage => <div key='2'>{stage}</div>
		},
	]

	rerender(<Animations renderers={renderers} />)
})