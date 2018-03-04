
describe('babel-plugin-jsx-mi2', () => {

  var TRANS = {name:'Name', city: 'City'};
  function t(code){
     return TRANS[code] || code;
  }

  it('jsx', () => {
    const vnode = render(h => <div city="City">Name: test</div>)
    
    expect(vnode.tag).toEqual('div')
    expect(vnode.children[0]).toEqual('Name: test')
    expect(vnode.attr.city).toEqual('City')
  })

  it('jsx inject', () => {
    const vnode = render(h => <template/>)
    
    expect(vnode.tag).toEqual('div')
    expect(vnode.children[0]).toEqual('From Template')
    expect(vnode.attr.city).toEqual('City 1')
  })

  it('jsx no inject', () => {
    const vnode = render(h => <template><b>aaa</b></template>)
    
    expect(vnode.tag).toEqual('template')
    expect(vnode.children[0].tag).toEqual('b')
  })

  it('template inject', () => {
    const template = '<-TEMPLATE->';
    
    expect(template).toEqual('<div city="City 1">From Template</div>');

  })


  function render(callback){
    return callback(createElement);
  }

  function createElement(tag, attr, ...children){
    return {tag, attr, children};
  }

})

