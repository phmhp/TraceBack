import test from 'node:test'
import assert from 'node:assert/strict'
import { SimulationClock } from '../src/core/SimulationClock.ts'
import { SimulationRuntime } from '../src/runtime/SimulationRuntime.ts'
import { TRACKBACK_SIMULATION_CALIBRATION_V0_1 as cal } from '../src/data/calibration/TrackbackSimulationCalibration.ts'

test('clock lifecycle uses fixed seconds; pause/stopped step never advances', () => {
  const clock = new SimulationClock()
  assert.equal(clock.step(), false)
  clock.start()
  for (let i = 0; i < 60; i++) clock.step()
  assert.equal(clock.currentTime, 1)
  assert.equal(clock.deltaTime, 1 / 60)
  clock.pause()
  assert.equal(clock.paused, true)
  assert.equal(clock.deltaTime, 0)
  assert.equal(clock.step(), false)
  assert.equal(clock.currentTime, 1)
  clock.resume(); clock.step()
  assert.equal(clock.currentTime, 61 / 60)
  clock.reset()
  assert.deepEqual([clock.currentTime, clock.deltaTime, clock.running, clock.paused], [0, 0, false, false])
  assert.throws(() => new SimulationClock(0))
})

function rig() {
  let steps = 0
  const deltas = []
  const publications = []
  const commands = []
  const physics = {
    step(command, dt) { assert.ok(Number.isFinite(command.driveForce)); commands.push({...command}); steps++; deltas.push(dt) },
    reset() { steps = 0 },
    readState(state) { state.position.z = -steps; state.speed = steps / 10 },
  }
  const runtime = new SimulationRuntime(cal, (value) => publications.push(value))
  runtime.attach(physics); runtime.start(); runtime.advance(0)
  publications.length = 0
  return { runtime, deltas, publications, commands, count: () => steps }
}
test('30/60/144 render fps all produce 600 fixed ticks and 100 HUD publications in 10 seconds', () => {
  for (const fps of [30, 60, 144]) {
    const r = rig()
    for (let i = 0; i < fps * 10; i++) r.runtime.advance(1 / fps)
    assert.equal(r.count(), 600)
    assert.equal(r.runtime.clock.currentTime, 10)
    assert.equal(r.publications.length, 100)
    assert.ok(r.deltas.every((dt) => dt === 1 / 60))
    assert.ok(r.publications.every((p) => !('position' in p) && p.kind === 'LIVE_SIMULATION'))
  }
})
test('pause freezes clock/physics; resume discards hidden-tab delta and clears control intent', () => {
  const r = rig()
  r.runtime.driverInput.setAccelerator(1)
  r.runtime.driverInput.setSteering(1)
  r.runtime.advance(1 / 30)
  r.runtime.pause()
  const time = r.runtime.clock.currentTime
  const steps = r.count()
  for (let i = 0; i < 200; i++) r.runtime.advance(2)
  assert.equal(r.runtime.clock.currentTime, time)
  assert.equal(r.count(), steps)
  assert.equal(r.publications.at(-1).accelerator, 0)
  r.runtime.resume(); r.runtime.advance(100)
  assert.equal(r.count(), steps)
  r.runtime.advance(1 / 60)
  assert.equal(r.count(), steps + 1)
})
test('long or invalid frame deltas cannot create unbounded catch-up', () => {
  const r = rig()
  r.runtime.advance(NaN); r.runtime.advance(Infinity); r.runtime.advance(-2)
  assert.equal(r.count(), 0)
  r.runtime.advance(10)
  assert.equal(r.count(), 6)
})
test('finish crossing publishes celebration state, coasts, then progressively brakes', () => {
  const r=rig(); r.runtime.configureFinish({x:0,z:-2},Math.PI); r.runtime.driverInput.setAccelerator(1)
  r.runtime.advance(1/30); assert.equal(r.publications.at(-1).raceFinished,true)
  const finishTime=r.runtime.clock.currentTime
  for(let i=0;i<60;i++)r.runtime.advance(1/60)
  assert.equal(r.runtime.clock.currentTime,finishTime)
  assert.equal(r.commands.at(-1).driveForce,0); assert.ok(r.commands.at(-1).brakeForce>0)
})

test('route departure blocks further movement and finish until restart', () => {
 const r=rig();r.runtime.configureRoute([{x:0,z:0},{x:0,z:-2}]);
 r.runtime.configureFinish({x:0,z:-23},Math.PI);
 for(let i=0;i<30;i++)r.runtime.advance(1/60);
 assert.equal(r.runtime.acceptsDrivingInput(),false);
 assert.match(r.publications.at(-1).error,/주행 경로/);
 assert.equal(r.publications.at(-1).raceFinished,false);
 const steps=r.count();r.runtime.resume();r.runtime.advance(.1);assert.equal(r.count(),steps);
 r.runtime.start();r.runtime.advance(0);r.runtime.advance(1/60);assert.equal(r.runtime.acceptsDrivingInput(),true);
});
