import React, { useState } from 'react'
import { getPatch } from 'fast-array-diff'
import { v4 as uuidv4 } from 'uuid'

type UUID = string & { __uuid: true }

function UUID(): UUID {
	return uuidv4() as UUID
}

/**
 * Possible lifecycles:
 * 
 * mount -> add -> stable -> remove -> (removed)
 * mount -> add -> remove -> (removed)
 */
export type AnimationStage = 'mount' | 'add' | 'stable' | 'remove'

export type Renderer = {
    key: string,
	render(stage: AnimationStage): React.ReactNode
	duration(stage: 'add' | 'remove'): number
}

type InternalRenderer = Renderer & { stage: AnimationStage, generation: UUID }

const debugLogging = false

function debugLog(x: unknown) {
	if (debugLogging) {
		console.log(x)
	}
}

export function Animations({renderers: externalChildren} : {renderers: Array<Renderer>}): JSX.Element {

	const [internalChildren, setInternalChildren] = useState<Array<InternalRenderer>>(externalChildren.map(child => ({ ...child, stage: 'stable', generation: UUID() })))

	const patches = getPatch(internalChildren, externalChildren, (a, b) => a.key === b.key)

	let i = 0
	let patchIndex = 0
	let ni = 0
	const delays = new Delays()
	while (i < internalChildren.length || patches.length > 0) {
		if (patches[0]?.oldPos === patchIndex) {
			const patch = patches.shift()!
			if (patch.type === 'add') {
				const newChildren = patch.items.map<InternalRenderer>(child => {
					const generation = UUID()
					delays.add(0, generation, 'mount')
					delays.add(child.duration('add'), generation, 'add')
					return { ...child, stage: 'mount', generation }
				})
				internalChildren.splice(i, 0, ...newChildren)
				i += patch.items.length
				ni += patch.items.length
			}
			else if (patch.type === 'remove') {
				internalChildren.slice(i, i + patch.items.length).forEach(child => {
					child.stage = 'remove'
					delays.add(child.duration('remove'), child.generation, 'remove')
				})
				i += patch.items.length
			}
		}
		if (i < internalChildren.length) {
			internalChildren[i].render = externalChildren[ni].render
			if (internalChildren[i].stage === 'remove') {
				internalChildren[i].generation = UUID()
				delays.add(0, internalChildren[i].generation, 'mount')
				delays.add(internalChildren[i].duration('add'), internalChildren[i].generation, 'add')
				internalChildren[i].stage = 'mount'
			}
		}
		i++
		patchIndex++
		ni++
	}

	delays.execute(ids => {
		setInternalChildren(children => {
			const now = Date.now()
			const result: InternalRenderer[] = []
			debugLog({
				delaysId: delays.id,
				children: Array.from(children),
				ids
			})
			for (const child of children) {
				if (ids.get(child.generation) === child.stage) {
					debugLog(`${now} ${child.stage} ${child.key} ${child.generation}`)
					if (child.stage === 'mount') {
						result.push({ ...child, stage: 'add' })
					}
					else if (child.stage === 'add') {
						result.push({ ...child, stage: 'stable' })
					}
					else if (child.stage === 'remove') {
						// Don't add it
					}
					else {
						result.push(child)
					}
				} else {
					result.push(child)
				}
			}
			return result
		})
	})

	return <>
		{internalChildren.map(({ stage, render }) => render(stage))}
	</>
}

class Delays {
	private readonly array: Array<{ delay: number, ids: Map<UUID, AnimationStage> }> = []

	readonly id = UUID()

	add(delay: number, id: UUID, stage: AnimationStage) {
		const index = findIndexRight(this.array, delay, (a, b) => a - b.delay)
		let item = this.array[index]
		if (item?.delay === delay && !item.ids.has(id)) {
			item.ids.set(id, stage)
		} else {
			item = { delay, ids: new Map([[id, stage]]) }
			this.array.splice(index + 1, 0, item)
		}
	}

	async execute(runner: (ids: ReadonlyMap<UUID, AnimationStage>) => void) {
		if (this.array.length > 0) {
			debugLog(this.id + '\n' + this.array.map(({ delay, ids }) => `${delay}: ${Array.from(ids).join(', ')}`).join('\n'))
		}
		let accumulatedDelay = 0
		while (true) {
			const item = this.array.shift()
			if (item === undefined) {
				return
			}
			await new Promise(resolve => setTimeout(resolve, item.delay - accumulatedDelay))
			accumulatedDelay += item.delay
			runner(item.ids)
		}
	}
}

function findIndexRight<T, I>(sortedArray: readonly T[], item: I, comparator: (a: I, b: T) => number): number {
	let low = 0
	let high = sortedArray.length
	while (low < high) {
		const mid = Math.floor((low + high) / 2)
		if (comparator(item, sortedArray[mid]) < 0) {
			high = mid
		} else {
			low = mid + 1
		}
	}
	return high - 1
}