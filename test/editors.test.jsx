import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {create,act} from 'react-test-renderer';
import {Courses,Tests} from '../src/ContentEditors.jsx';

const options={createNodeMock:()=>({scrollIntoView:()=>Promise.resolve()})};
const findButton=(tree,text)=>tree.root.findAllByType('button').find(b=>b.children.join('')===text);
const question={prompt:'Question',options:['First','Second'],answer:1,explanation:'Explanation'};

test('course editor opens legacy course, preserves values, cancels and adds exam',async()=>{
 let tree;const errors=[];const original=console.error;console.error=(...args)=>errors.push(args);
 const calls=[];global.fetch=async(url,options)=>{calls.push({url,body:JSON.parse(options.body)});return {ok:true,json:async()=>({})};};
 try {
  await act(async()=>{tree=create(<Courses token="test" courses={[{id:'legacy',title:'Old course',description:'Saved description',active:true,lessons:[]}]} onSaved={async()=>{}}/>,options);});
  await act(async()=>findButton(tree,'Курс засах').props.onClick());
  assert.equal(tree.root.findAllByType('input')[0].props.value,'Old course');
  await act(async()=>findButton(tree,'Болих').props.onClick());
  await act(async()=>findButton(tree,'+ Үндсэн шалгалт нэмэх').props.onClick());
  await act(async()=>findButton(tree,'Болих').props.onClick());
  await act(async()=>findButton(tree,'Курс засах').props.onClick());
  await act(async()=>tree.root.findAllByType('input')[0].props.onChange({target:{value:'Edited course'}}));
  await act(async()=>tree.root.findByType('form').props.onSubmit({preventDefault(){}}));
  assert.equal(calls[0].url,'/api/courses/legacy');assert.equal(calls[0].body.title,'Edited course');assert.equal(calls[0].body.description,'Saved description');
  await act(async()=>tree.unmount());assert.deepEqual(errors,[]);
 }finally{console.error=original;}
});
test('test form edits correct answer and persists question payload',async()=>{
 const calls=[];global.fetch=async(url,options)=>{if(options.method==='GET')return {ok:true,json:async()=>[{id:'general',name:'General',active:true}]};calls.push({url,body:JSON.parse(options.body)});return {ok:true,json:async()=>({})};};
 let tree;await act(async()=>{tree=create(<Tests token="test" tests={[{id:'test1',title:'Existing test',category:'General',questionItems:[question]}]} onSaved={async()=>{}}/>,options);});
 await act(async()=>findButton(tree,'Засах').props.onClick());
 await act(async()=>tree.root.findAllByType('input').find(i=>i.props.type==='radio').props.onChange());
 await act(async()=>tree.root.findByType('form').props.onSubmit({preventDefault(){}}));
 assert.equal(calls[0].url,'/api/tests/test1');assert.equal(calls[0].body.questionItems[0].answer,0);assert.deepEqual(calls[0].body.questionItems[0].options,['First','Second']);
 await act(async()=>findButton(tree,'+ Сорил нэмэх').props.onClick());
 assert.ok(tree.root.findAllByType('textarea').length>=2);
 await act(async()=>findButton(tree,'Болих').props.onClick());await act(async()=>tree.unmount());
});

import {Users,Stories} from '../src/PlatformManagers.jsx';
test('user editor saves profile fields without browser prompts or changing password',async()=>{
 const calls=[];global.fetch=async(url,o)=>{calls.push({url,body:JSON.parse(o.body),method:o.method});return {ok:true,json:async()=>({})};};
 let tree;await act(async()=>{tree=create(<Users token="t" users={[{id:'doctor',name:'Doctor',email:'doctor@example.test',role:'learner',memberLevel:'bronze',paymentStatus:'unpaid',active:true}]} onSaved={async()=>{}}/>);});
 await act(async()=>findButton(tree,'Засах').props.onClick());await act(async()=>tree.root.findAllByType('input')[0].props.onChange({target:{value:'Updated Doctor'}}));await act(async()=>tree.root.findByType('form').props.onSubmit({preventDefault(){}}));assert.equal(calls[0].url,'/api/users/doctor');assert.equal(calls[0].method,'PATCH');assert.equal(calls[0].body.name,'Updated Doctor');assert.equal(calls[0].body.password,'');await act(async()=>tree.unmount());
});
test('story form defaults to publish and still allows saving a draft',async()=>{
 const calls=[];global.fetch=async(url,o)=>{calls.push({url,body:JSON.parse(o.body)});return {ok:true,json:async()=>({})};};let tree;await act(async()=>{tree=create(<Stories token="t" stories={[]} onSaved={async()=>{}}/>);});await act(async()=>findButton(tree,'+ Story нэмэх').props.onClick());assert.equal(tree.root.findAllByType('input').find(x=>x.props.type==='checkbox').props.checked,true);await act(async()=>tree.root.findAllByType('input').find(x=>x.props.type==='checkbox').props.onChange({target:{checked:false}}));await act(async()=>tree.root.findByType('form').props.onSubmit({preventDefault(){}}));assert.equal(calls[0].url,'/api/stories');assert.equal(calls[0].body.published,false);await act(async()=>tree.unmount());
});

import LearningAnalytics from '../src/LearningAnalytics.jsx';
test('pretest editor creates the course baseline with metadata',async()=>{
 const calls=[];global.fetch=async(url,o)=>{calls.push({url,body:JSON.parse(o.body),method:o.method});return {ok:true,json:async()=>({})};};let tree;
 await act(async()=>{tree=create(<Courses token="t" courses={[{id:'course',title:'Course',lessons:[],preTest:{title:'Baseline',questionItems:[{...question,topic:'Communication',difficulty:'medium'}]}}]} onSaved={async()=>{}}/>,options);});
 await act(async()=>findButton(tree,'Pre-test засах').props.onClick());await act(async()=>tree.root.findByType('form').props.onSubmit({preventDefault(){}}));
 assert.equal(calls[0].url,'/api/courses/course/pre-test');assert.equal(calls[0].method,'PATCH');assert.equal(calls[0].body.questionItems[0].topic,'Communication');await act(async()=>tree.unmount());
});
test('analytics empty data is honest and supports all three views',async()=>{
 const data={funnel:{started:0,completed:0,pending:0},courses:[],topics:[],questions:[],insights:[],features:[],active:0,previousActive:0,accuracy:null,returnRate:null,searches:0,emptySearches:0};let tree;await act(async()=>{tree=create(<LearningAnalytics data={data}/>);});
 for(const name of ['Хөгжүүлэгч','Удирдлага','Эмч-багш'])await act(async()=>findButton(tree,name).props.onClick());assert.ok(JSON.stringify(tree.toJSON()).includes('Өгөгдөл'));await act(async()=>tree.unmount());
});

import Games from '../src/Games.jsx';
test('game editor saves changed sequence and hides it',async()=>{
 const calls=[];global.fetch=async(url,o)=>{calls.push({url,body:JSON.parse(o.body)});return {ok:true,json:async()=>({})};};let tree;await act(async()=>{tree=create(<Games token="t" games={[{id:'g',title:'Order',description:'Arrange',type:'sequence',items:['One','Two'],active:true,questionItems:[]}]} onSaved={async()=>{}}/>);});await act(async()=>findButton(tree,'Засах').props.onClick());await act(async()=>tree.root.findAllByType('input').find(x=>x.props.type==='checkbox').props.onChange({target:{checked:false}}));await act(async()=>tree.root.findByType('form').props.onSubmit({preventDefault(){}}));assert.equal(calls[0].url,'/api/games/g');assert.deepEqual(calls[0].body.items,['One','Two']);assert.equal(calls[0].body.active,false);await act(async()=>tree.unmount());
});
test('premium flag is saved by test editor',async()=>{
 const calls=[];global.fetch=async(url,o)=>{if(o.method==='GET')return {ok:true,json:async()=>[{id:'g',name:'General',active:true}]};calls.push(JSON.parse(o.body));return {ok:true,json:async()=>({})};};let tree;await act(async()=>{tree=create(<Tests token="t" tests={[{id:'p',title:'Premium',category:'General',premium:true,questionItems:[question]}]} onSaved={async()=>{}}/>,options);});await act(async()=>findButton(tree,'Засах').props.onClick());await act(async()=>tree.root.findByType('form').props.onSubmit({preventDefault(){}}));assert.equal(calls[0].premium,true);await act(async()=>tree.unmount());
});
