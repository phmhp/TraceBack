import test from 'node:test'
import assert from 'node:assert/strict'
import { requirementFocus } from '../src/ui/xray/requirementFocus.ts'
test('focus follows full ancestry and descendants without selecting sibling requirements',()=>{
 const edge=(from,to,kind='trace')=>({from,to,kind});
 const edges=[edge('domain','top','group'),edge('top','parent'),edge('parent','chosen'),edge('parent','sibling'),edge('chosen','leaf'),edge('leaf','TC','test'),edge('parent','TC-parent','test'),edge('sibling','TC-sibling','test')];
 const found=requirementFocus('chosen',edges);
 assert.deepEqual([...found].sort(),['chosen','parent','top','leaf','TC','TC-parent'].sort());
 assert.ok(!found.has('sibling'));assert.ok(!found.has('TC-sibling'));
});
