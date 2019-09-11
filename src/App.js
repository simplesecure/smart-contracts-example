import React from 'react';
import logo from './logo.svg';
import './App.css';
import { tsArrayType } from '@babel/types';
const ethers = require('ethers');
const request = require('request-promise');
let bytecode = require('./contracts/TodoList.json').bytecode;
let abi = require('./contracts/TodoList.json').abi;
let contractAddress = "0xEC80Dc659BBea656E6bA8FB15aE488c3cd74e812";
let ropContractAddress = "0x38FbF13BbF1bc9abaaf2ece13aA1Aeb1b24d7a35";
let headers = { 'Content-Type': 'application/json', 'Accept': 'application/json' };
let url = "http://127.0.0.1:7545";
let customHttpProvider = new ethers.providers.JsonRpcProvider(url);


class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      tasks: [], 
      gas: 0,
      showGas: false, 
      loading: true, 
      newTaskContent: "", 
      payload: {}
    }
  }

  componentDidMount() {
    this.fetchContract();
  }

  estimateGas = (data) => {
    let payload = data;
    const options = { url: 'http://localhost:5000/estimateGas', method: 'POST', headers: headers, body: JSON.stringify(payload) };
    return request(options)
    .then(async (body) => {
      // POST succeeded...
      const gas = JSON.parse(body);
      this.setState({ gas, showGas: true });
    })
    .catch(error => {
      // POST failed...
      console.log('ERROR: ', error)
    });
  }

  deployContract = async() => {
    //this needs to happen on the server
    const payload = {
      abi, 
      bytecode
    }
  
    const options = { url: 'http://localhost:5000/ganache/deployContract', method: 'POST', headers: headers, body: JSON.stringify(payload) };
    return request(options)
    .then(async (body) => {
      // POST succeeded...
      let contract = JSON.parse(body);
      console.log(contract);
    })
    .catch(error => {
      // POST failed...
      console.log('ERROR: ', error)
    });
  }
  
  fetchContract = async () => {
    let tasksArr = [];
    //This can happen client side as no gas is spent
    let contract = await new ethers.Contract(contractAddress, abi, customHttpProvider);
    let taskCountRaw = await contract.taskCount();
    const taskCount = taskCountRaw.toNumber();
    console.log(taskCount);
    var i;
    for (i = 1; i < taskCount+1; i++) {
      let task = await contract.tasks(i);
      const taskObj = {
        id: task[0].toNumber(),
        content: task[1],
        completed: task[2]
      }
      console.log(taskObj)
      tasksArr.push(taskObj);
      this.setState({tasks: tasksArr})
    } 
    this.setState({ loading: false });
  }

  newTask = async () => {
    const { newTaskContent } = this.state;
    const updates = {
      functionName: "createTask",
      value: newTaskContent
    }
    const payload = {
      abi, 
      contractAddress, 
      updates, 
      network: "local"
    }

    this.setState({ payload });
    this.estimateGas(payload);
  }

  toggleTask = (id) => {
    const { tasks } = this.state;
    let thisTask = tasks[id];
    thisTask.completed = !thisTask.completed;
    const updates = {
      functionName: "toggleCompleted",
      value: id
    }
    const payload = {
      abi, 
      contractAddress, 
      updates, 
      network: "local"
    }

    this.setState({ payload });
    this.estimateGas(payload);
  }

  approveTransaction = () => {
    const { payload } = this.state;
    this.setState({ newTaskContent: "", payload: {}, gas: 0, showGas: false, loading: true });
    const options = { url: 'http://localhost:5000/sendTx', method: 'POST', headers: headers, body: JSON.stringify(payload) };
    return request(options)
    .then(async (body) => {
      // POST succeeded...
      console.log(JSON.parse(body));
      this.fetchContract();
    })
    .catch(error => {
      // POST failed...
      this.setState({ loading: false });
      console.log('ERROR: ', error);
    });
  }

  handleChange = (e) => {
    this.setState({newTaskContent: e.target.value })
  }

  render() {
    const { tasks, gas, showGas, loading, newTaskContent } = this.state;
    return (
      <div>
        {
          loading ? 
          <div>
            <h1>Fetching tasks...</h1>
          </div> : 
          showGas ? 
          <div>
            <p>This transaction requires {gas} gas. Approve transaction?</p>
            <button onClick={this.approveTransaction}>Approve</button>
            <button onClick={this.rejectTransaction}>Reject</button>
          </div> : 
          <div>
          <button onClick={this.deployContract}>Deploy Contract</button>
          <button onClick={this.fetchContract}>Fetch Contract</button>
            {
              tasks.map((task) => {
                return (
                  <div key={task.id}>
                    <p><input type="checkbox" onChange={() => this.toggleTask(task.id)} checked={task.completed} /> <span style={task.completed ? {textDecoration: "strikethrough"} : {textDecortaion: "none"}}>{task.content}</span></p>
                  </div>
                )
              })
            }
            <div>
              <input type="text" value={newTaskContent} onChange={this.handleChange} placeholder="new task" />
              <button onClick={this.newTask}>New Task</button>
            </div>
          </div>
        }
      </div>
    );
  }
}

export default App;
