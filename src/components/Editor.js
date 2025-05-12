import React, { useEffect, useRef } from 'react';
import CodeMirror from 'codemirror';
import 'codemirror/lib/codemirror.css';
import 'codemirror/mode/javascript/javascript.js';
import 'codemirror/theme/dracula.css';
import 'codemirror/addon/edit/closetag.js';
import 'codemirror/addon/edit/closebrackets.js';
import ACTIONS from '../pages/actions';

const Editor = ({ socketRef, roomId, onCodeChange}) => {
  const editorRef = useRef(null);             // Reference to <textarea>
  const codeMirrorInstance = useRef(null);    // Store CodeMirror instance

  useEffect(() => {
    if (editorRef.current && !codeMirrorInstance.current) {
      codeMirrorInstance.current = CodeMirror.fromTextArea(editorRef.current, {
        mode: { name: 'javascript', json: true },
        theme: 'dracula',
        autoCloseTags: true,
        autoCloseBrackets: true,
        lineNumbers: true,
      });

      

      codeMirrorInstance.current.on('change', (instance, changes) => {
        console.log('changes', changes);
        const { origin } = changes;
        const code = instance.getValue();
        onCodeChange(code);
        if (origin !== 'setValue') {
          socketRef.current.emit(ACTIONS.CODE_CHANGE, {
            roomId,
            code,
          });
        }
        
      });

      
    }

    codeMirrorInstance.current.setSize('100%', '100%');

    return () => {
      if (codeMirrorInstance.current) {
        codeMirrorInstance.current.toTextArea(); // Cleanup editor
        codeMirrorInstance.current = null;
      }
    };
  }, []);

  useEffect(() =>{
    if(socketRef.current){
     socketRef.current.on(ACTIONS.CODE_CHANGE, ({ code }) => {
        console.log('receiving', code);
        if (code !== null) {
          codeMirrorInstance.current.setValue(code);
        }
      });
    }

    return () =>{
      if (socketRef.current) {
      socketRef.current.off(ACTIONS.CODE_CHANGE);
    }
  }
  }, [socketRef.current]);

  return <textarea ref={editorRef} />;
};

export default Editor;  