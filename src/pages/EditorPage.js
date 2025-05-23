import React, { useState, useRef, useEffect } from 'react';
import toast from 'react-hot-toast';
import ACTIONS from './actions';
import axios from 'axios';
import Client from '../components/Client';
import Editor from '../components/Editor';
import { initSocket } from '../socket';
import { useLocation, useNavigate, Navigate, useParams } from 'react-router-dom';

const EditorPage = () => {
  const socketRef = useRef(null);
  const codeRef = useRef(null);
  const location = useLocation();
  const { roomId } = useParams();
  const [code, setCode] = useState('');
const [language, setLanguage] = useState('python');
const [output, setOutput] = useState('');
const [loading, setLoading] = useState(false);
const [status, setStatus] = useState('');
  const reactNavigator = useNavigate();

  const [clients, setClients] = useState([]);

  useEffect(() => {
    const init = async () => {
      try {
        socketRef.current = await initSocket();

        const handleErrors = (e) => {
          console.log('socket error', e);
          toast.error('Socket connection failed, try again later.');
          reactNavigator('/');
        };

        socketRef.current.on('connect_error', handleErrors);
        socketRef.current.on('connect_failed', handleErrors);

        socketRef.current.emit(ACTIONS.JOIN, {
          roomId,
          username: location.state?.username,
        });

        socketRef.current.on(ACTIONS.JOINED, ({ clients, username, socketId }) => {
          if (username !== location.state?.username) {
            toast.success(`${username} joined the room.`);
            console.log(`${username} joined`);
          }

          setClients(clients);
          socketRef.current.emit(ACTIONS.SYNC_CODE,  {
            code : codeRef.current,
            socketId,
          });
        });

        socketRef.current.on(ACTIONS.DISCONNECTED, ({ socketId, username }) => {
          toast.success(`${username} left the room.`);
          setClients((prev) => {
            return prev.filter((client) => client.socketId !== socketId);
          });
        });
      } catch (err) {
        console.error('Socket initialization failed', err);
        toast.error('Socket connection failed, try again later.');
        reactNavigator('/');
      }
    };

    init();
    
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current.off(ACTIONS.JOINED);
        socketRef.current.off(ACTIONS.DISCONNECTED);
        socketRef.current.off('connect_error');
        socketRef.current.off('connect_failed');
      }
    };
  }, []);

  async function copyRoomId(){
    try{
    await navigator.clipboard.writeText(roomId);
    toast.success('Room ID has been copied to your clipboard');
    } catch(err){
        toast.error('Could not copy the ROOM ID');
        console.error(err);
    }
  }

 function leaveRoom(){
    reactNavigator('/');
  }

  if (!location.state) {
    return <Navigate to="/" />;
  }
 console.log(code)
  const encode = (str) => btoa(((str)));
   console.log(code)
  const runCodeWithJudge0 = async () => {
  
      setLoading(true);
  setStatus('Running...');
const safeBase64Decode = (str) => {
  try {
    return decodeURIComponent(escape(atob(str)));
  } catch {
    return str;
  }
};

  const languageIds = {
    python: 71, // Python 3
    cpp: 54 ,    // C++ (GCC 9.2.0)
    JavaScript:63,
    Java:62,
  };


  try {
    console.log('Sending to Judge0:', {
  source_code: encode(code),
});

    const response = await axios.post(
      'https://judge0-ce.p.rapidapi.com/submissions?base64_encoded=true&wait=true',
      {
        language_id:languageIds(language),
        source_code: encode(code),
         stdin: btoa('') 
      },
      {
        headers: {
          'content-type': 'application/json',
          'X-RapidAPI-Key': 'cce24d91e0mshf2a9f60b37b9089p12137djsn52d754cb066c',
          'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com'
        }
      }
    );
 const { stdout, stderr, compile_output, time, memory } = response.data;
 let result = '';
    if (stdout) result += atob(stdout);
    if (compile_output) result += `\nCompiler Output:\n${atob(compile_output)}`;
    if (stderr) result += `\nError:\n${atob(stderr)}`;

    
    if (time !== null && memory !== null) {
      result += `\n\n⏱ Time: ${time}s\n🧠 Memory: ${memory} KB`;
    }

    setOutput(result || 'No output');
    
    setStatus(null);

  console.log("Full response:", response.data);

  
  } catch (error) {
    console.error('Judge0 Error:', error.response?.data || error.message);
  setOutput('❌ Error: ' + (error.response?.data?.error || 'Something went wrong.'));
  }
  setLoading(false);
};


  return (
    <>

    <div className="mainWrap">
      <div className="aside">
        <div className="asideinner">
          <div className="Logo">
            <img className="logoImage" src="/sync-logo.jpg" alt="logo" />
          </div>
          <h3>Connected</h3>
          <div className="clientsList">
            {clients.map((client) => (
              <Client key={client.socketId} username={client.username} />
            ))}
          </div>
        </div>
        <button className="btn copyBtn" onClick={copyRoomId}>COPY ROOM ID</button>
        <button className="btn leaveBtn" onClick={leaveRoom}>LEAVE</button>
      </div>
      <div className="editorWrap">
  <div className="editorHeader">
    <h2 className="editorTitle">🛠 SYNC Code Editor</h2>
    <div className="editorControls">
      <select
        className="languageSelect"
        onChange={(e) => setLanguage(Number(e.target.value))}
      >
        <option value="71">Python</option>
        <option value="54">C++</option>
        <option value="63">JavaScript</option>
      </select>
      <button className="runBtn" onClick={runCodeWithJudge0}>▶ Run</button>
    </div>
  </div>

  <Editor
    socketRef={socketRef}
    roomId={roomId}
    onCodeChange={(code) => {
      codeRef.current = code;
      setCode(code);
    }}
  />
<div className="outputSection">
  <h3 className="text-xl font-bold mb-2">Output:</h3>
  {loading ? (
    <div className="italic text-blue-300">⏳ {status || 'Running...'}</div>
  ) : (
    <>
      <pre className="outputText">{output}</pre>
    </>
  )}
</div>

</div>
<div className="footer"></div>



      </div>
    </>
  );
};

export default EditorPage;
