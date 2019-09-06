
module.exports = function (babel) {
  var t = babel.types
  var fs = require('fs');
  var bracketsReg = /\[\[([0-9a-zA-Z-_\.]+)\]\]/g;

  return {
    visitor: {
        StringLiteral: function(path, state) {
          if(path.node.value =='<-TEMPLATE->'){
            var filename = state.file.opts.filename;
            var idx = filename.lastIndexOf('.js');
            if(idx != -1){
              var templatename = filename.substring(0,idx)+'.html';
              if(!fs.existsSync(templatename)) throw new Error('template not found '+templatename);
              var text = fs.readFileSync(templatename,"utf8");
              var arr = splitText(text, state.file.opts);

              if(arr.length){
                path.replaceWithMultiple(binaryExpressionMulti('+',arr));            
              }else{
                path.node.value = text
              }
            }
          }
        },
        JSXElement: {
        exit (path, state) {
          var name = path.node.openingElement.name.name;
          if(name == 'template' && t.isReturnStatement(path.parentPath) && path.node.openingElement.selfClosing){
            var filename = state.file.opts.filename;
            var idx = filename.lastIndexOf('.js');
            var srcOpts = state.file.opts;

            if(idx != -1){
              var templatename = filename.substring(0,idx)+'.tpl';
              
              var transformOpts = {parserOpts:{sourceFilename: templatename}, code:false};
              ['presets','plugins'].map(function(p){ transformOpts[p] = srcOpts[p]; });

              var tpl;
              if(srcOpts.parserOpts.templateContent)
                tpl = babel.transform(srcOpts.parserOpts.templateContent, transformOpts);
              else{
                fs.existsSync(templatename)
                  tpl = babel.transformFileSync(templatename, transformOpts);
                else{
                  console.error("template directive found in filename but template file is missing "+templatename);
                }
              }

              if(tpl){              
                var body = tpl.ast.program.body;
                body[body.length-1] = t.returnStatement(body[body.length-1].expression);
                path.parentPath.replaceWithMultiple(body);            
              }
            }
          }
        }
      }
    }
  }

  function splitText(text, opts){
    var reg = new RegExp(opts.reg || bracketsReg);
    var ex, expr;
    var offset = 0;
    var arr = [];
    while( (ex = reg.exec(text)) ){
      if(ex.index > offset){
        expr = t.stringLiteral(text.substring(offset, ex.index)); // text
        arr.push(expr);
      }
      expr = t.callExpression(
        t.identifier(opts.func || 't'), 
        [t.stringLiteral(ex[1])] // from regex
      );
      arr.push(expr);
      offset = ex.index+ex[0].length
    }
    if(arr.length && offset<text.length){
      arr.push(t.stringLiteral(text.substring(offset, text.length)));
    }

    return arr;
  }


  function binaryExpressionMulti(op,arr){
    var expr = arr[0];
    if(arr.length > 1){
      expr = t.binaryExpression(op,arr[0], arr[1]);
      for(var i=2; i<arr.length; i++){
        expr = t.binaryExpression(op,expr, arr[i])
      }
    }
    return expr;
  }
}

