import test from 'node:test'
import assert from 'node:assert/strict'
import { DriverInputRuntime } from '../src/runtime/driver/DriverInputRuntime.ts'
import { KeyboardMapping, isEditableTarget } from '../src/input/keyboard/KeyboardMapping.ts'
import { bindKeyboardInput } from '../src/input/keyboard/KeyboardInputAdapter.ts'
import { writeTemporaryBrakeCommand, writeTemporarySteeringCommand } from '../src/runtime/control/TemporaryBrakeSteeringAdapters.ts'
import { SimulationRuntime } from '../src/runtime/SimulationRuntime.ts'
import { TRACKBACK_SIMULATION_CALIBRATION_V0_1 as cal } from '../src/data/calibration/TrackbackSimulationCalibration.ts'

function mapped(mapping) {
  return { ...mapping.read({ accelerator: 0, brake: 0, steering: 0 }) }
}
const response = cal.keyboardPedalResponse

test('DriverInputRuntime clamps input and keeps GearRequest distinct from actual GearState', () => {
  const input = new DriverInputRuntime()
  input.setAccelerator(2)
  input.setBrake(-1)
  input.setSteering(-4)
  input.setGearRequest('R')
  input.advance(1, response)
  assert.deepEqual(input.getState(), { accelerator: 1, acceleratorValidity: 'VALID', brake: 0, steering: -1, gearRequest: 'R', gearRequestValidity: 'VALID' })
  input.setAccelerator(Number.NaN)
  input.reset()
  assert.deepEqual(input.getState(), { accelerator: 0, acceleratorValidity: 'VALID', brake: 0, steering: 0, gearRequest: 'D', gearRequestValidity: 'VALID' })
})

test('keyboard pedal targets rise and release progressively at fixed-tick rates', () => {
  const input = new DriverInputRuntime()
  input.setAccelerator(1)
  input.advance(0.25, response)
  assert.equal(input.getState().accelerator, response.acceleratorRisePerSecond * 0.25)
  input.setAccelerator(0)
  input.advance(0.1, response)
  assert.ok(Math.abs(input.getState().accelerator - Math.max(0, response.acceleratorRisePerSecond * 0.25 - response.acceleratorFallPerSecond * 0.1)) < 1e-12)
  input.setBrake(1)
  input.advance(0.1, response)
  assert.ok(Math.abs(input.getState().brake - response.brakeRisePerSecond * 0.1) < 1e-12)
})

test('pure keyboard mapping handles press/release, neutral steering and independent pedals', () => {
  const mapping = new KeyboardMapping()
  mapping.keyDown('ArrowUp')
  assert.deepEqual(mapped(mapping), { accelerator: 1, brake: 0, steering: 0 })
  mapping.keyDown('ArrowDown')
  assert.deepEqual(mapped(mapping), { accelerator: 1, brake: 1, steering: 0 })
  mapping.keyDown('ArrowLeft')
  assert.equal(mapped(mapping).steering, -1)
  mapping.keyDown('ArrowRight')
  assert.equal(mapped(mapping).steering, 0)
  mapping.keyUp('ArrowLeft')
  assert.equal(mapped(mapping).steering, 1)
  mapping.keyUp('ArrowRight')
  mapping.keyUp('ArrowUp')
  assert.deepEqual(mapped(mapping), { accelerator: 0, brake: 1, steering: 0 })
  assert.equal(mapping.keyDown('Digit1'), false)
})

function key(target, type, code, repeat = false) {
  const event = new Event(type, { cancelable: true })
  Object.defineProperties(event, { code: { value: code }, repeat: { value: repeat } })
  target.dispatchEvent(event)
  return event
}

test('browser adapter writes DriverInput only and Pause/blur reset it to neutral', () => {
  const target = new EventTarget()
  const input = new DriverInputRuntime()
  let accepting = true
  let paused = false
  const lifecycle = {
    acceptsDrivingInput: () => accepting,
    togglePause: () => { paused = !paused; accepting = !paused },
    pause: () => { paused = true; accepting = false },
  }
  const binding = bindKeyboardInput(target, input, lifecycle)
  assert.equal(key(target, 'keydown', 'ArrowUp').defaultPrevented, true)
  key(target, 'keydown', 'ArrowDown')
  key(target, 'keydown', 'ArrowLeft')
  input.advance(1, response)
  assert.equal(input.getState().accelerator, 1); assert.equal(input.getState().brake, 1); assert.equal(input.getState().steering, -1)
  key(target, 'keydown', 'Digit2'); assert.equal(input.getState().gearRequest, 'R')
  key(target, 'keyup', 'ArrowUp')
  input.advance(1, response)
  assert.equal(input.getState().accelerator, 0)
  key(target, 'keydown', 'Escape')
  assert.equal(paused, true)
  assert.equal(input.getState().gearRequest, 'R'); assert.equal(input.getState().accelerator, 0)
  key(target, 'keydown', 'ArrowUp', true)
  assert.equal(input.getState().accelerator, 0)
  target.dispatchEvent(new Event('blur'))
  assert.equal(input.getState().gearRequest, 'R'); assert.equal(input.getState().accelerator, 0)
  binding.dispose()
})

test('editable target detection protects future X-Ray inputs and selects', () => {
  assert.equal(isEditableTarget({ tagName: 'INPUT' }), true)
  assert.equal(isEditableTarget({ tagName: 'TEXTAREA' }), true)
  assert.equal(isEditableTarget({ tagName: 'SELECT' }), true)
  assert.equal(isEditableTarget({ tagName: 'DIV', isContentEditable: true }), true)
  assert.equal(isEditableTarget({ tagName: 'BUTTON' }), false)
})

test('temporary brake and steering adapters do not create drive force', () => {
  const input = new DriverInputRuntime()
  input.setAccelerator(0.7)
  input.setBrake(0.4)
  input.setSteering(0.5)
  input.advance(1, response)
  const command = { driveForce: -1, brakeForce: -1, steering: -1 }
  writeTemporaryBrakeCommand(input.getState(), command)
  writeTemporarySteeringCommand(input.getState(), 5, command)
  assert.equal(command.driveForce, -1)
  assert.equal(command.brakeForce, 2600)
  assert.ok(command.steering > 0)
  assert.equal(input.getState().accelerator, 0.7)
})

test('SimulationRuntime samples DriverInput at physics tick and publishes it only at 10 Hz', () => {
  let command
  const publications = []
  const runtime = new SimulationRuntime(cal, (value) => publications.push(value))
  runtime.attach({ reset() {}, readState(state) { state.speed = 2 }, step(value) { command = { ...value } } })
  runtime.start(); runtime.advance(0)
  publications.length = 0
  runtime.driverInput.setAccelerator(0.5)
  runtime.driverInput.setSteering(-0.25)
  for (let i = 0; i < 6; i++) runtime.advance(1 / 60)
  assert.ok(command.driveForce > 0)
  assert.ok(command.steering < 0)
  assert.equal(publications.length, 1)
  assert.deepEqual(
    { accelerator: publications[0].accelerator, brake: publications[0].brake, steering: publications[0].steering, gear: publications[0].gear },
    { accelerator: 0.135, brake: 0, steering: -0.25, gear: 'D' },
  )
  runtime.pause()
  assert.equal(runtime.driverInput.getState().accelerator, 0); assert.equal(runtime.driverInput.getState().gearRequest, 'D')
})
