import './App.css';
import { Chat } from './components/Chat';

function App() {
  return (
    <div className="App">
      <header className="app-header">
        <h1>SQL Chat POC</h1>
        <p>Ask questions about the roofing database</p>
      </header>
      <Chat />
    </div>
  );
}

export default App;
