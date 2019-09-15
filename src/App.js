import React from 'react';
import './App.css';
const request = require('request-promise');
let bytecode = require('./contracts/TodoList.json').bytecode;
let abi = require('./contracts/TodoList.json').abi;
let contractAddress = "0xb7916f9D6587441A7af652fD1378E892CA67d331";
let ropContractAddress = "0x13127a8969099dB949f63a264B02d6F6B3a61081";
let network = "ropsten";
const infuraKey = "b8c67a1f996e4d5493d5ba3ae3abfb03";
const Web3 = require('web3');
const provider = new Web3.providers.HttpProvider(network === "local" ? 'http://localhost:7545' : `https://${network}.infura.io/v3/${infuraKey}`);
var web3 = new Web3(provider);
web3.eth.net.isListening()
   .then(() => console.log('web3 is connected'))
   .catch(e => console.log('Wow. Something went wrong'));
let headers = { 'Content-Type': 'application/json', 'Accept': 'application/json' };
web3.eth.getAccounts().then(console.log)
const account1 = "0xe9CF9486ECf63bdA487B64698085A51392f42081"; //Fetch this from the user session object
class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      tasks: [], 
      gas: 0,
      showGas: false, 
      loading: true, 
      newTaskContent: "", 
      payload: {}, 
      password: "", 
      simpleIDContract: "0x6d87224fd2837738235Fb6D0F3a422F95bEa16Ac", 
      yourContractAddress: "", 
      customAddress: "", 
      contractApproval: false, 
      error: ""
    }
  }

  componentDidMount() {
    const yourContractAddress = sessionStorage.getItem('your_contract_address') || "";
    this.setState({ yourContractAddress, customAddress: yourContractAddress });
    this.fetchContract();
  }

  handleAddrChange = (e) => {
    this.setState({ customAddress: e.target.value });
  }

  handlePassword = (e) => {
    this.setState({ password: e.target.value });
  }

  estimateGas = async (data) => {
    this.setState({ error: "" });
    console.log(data);
    const address = network === "local" ? contractAddress : ropContractAddress;
    let contract = new web3.eth.Contract(abi, address);
    const myData = contract.methods[data.updates.functionName](data.updates.value).encodeABI();
    let estimate;
    web3.eth.getTransactionCount(account1, async (err, txCount) => {
      try {
        // Build the transaction
        const txObject = {
          from: account1,
          nonce:    web3.utils.toHex(txCount),
          to:       address,
          value:    web3.utils.toHex(web3.utils.toWei('0', 'ether')),
          gasLimit: web3.utils.toHex(2100000),
          gasPrice: web3.utils.toHex(web3.utils.toWei('6', 'gwei')),
          data: myData  
        }
        estimate = await web3.eth.estimateGas(txObject);
        this.setState({ showGas: true, gas: estimate });

      } catch (error) {
          console.log(error);
      }
    });
  }

  deployContract = async() => {
    this.setState({ error: "" });
    const payload = {
      abi, 
      bytecode, 
      network
    }
    this.setState({payload});
    let estimate;
    web3.eth.getTransactionCount(account1, async (err, txCount) => {
      try {
        // Build the transaction
        const txObject = {
          from: account1,
          nonce:    web3.utils.toHex(txCount),
          value:    web3.utils.toHex(web3.utils.toWei('0', 'ether')),
          gasLimit: web3.utils.toHex(2100000),
          gasPrice: web3.utils.toHex(web3.utils.toWei('6', 'gwei')),
          data: bytecode 
        }
        estimate = await web3.eth.estimateGas(txObject);
        this.setState({ showGas: true, gas: estimate, contractApproval: true });

      } catch (error) {
          console.log(error);
      }
    });
  }
  
  fetchContract = async (custom) => {
    this.setState({ error: "", loading: true });
    const { customAddress } = this.state;
    let address = custom ? customAddress : network === "local" ? contractAddress : ropContractAddress;
    let tasksArr = [];

    ///////WEB3JS CODE//////
    let contract = new web3.eth.Contract(abi, address);
    const taskCount = await contract.methods.taskCount().call();
    const count = JSON.parse(taskCount);
    const localTaskCount = JSON.parse(localStorage.getItem('task-count')) || 0;
    const localTask = JSON.parse(localStorage.getItem('new-task')) || {};
    var i;
    for (i = 1; i < count + 1; i++) {
      let task = await contract.methods.tasks(i).call();
      const taskObj = {
        id: task[0],
        content: task[1],
        completed: task[2]
      }
      console.log(taskObj)
      tasksArr.push(taskObj);
      this.setState({tasks: tasksArr})
    } 
    //If the tx hasn't been mined yet
    if(count < localTaskCount) {
      console.log("Awaiting tx mining...");
      localTask.id = JSON.stringify(localTask.id);
      console.log(localTask)
      tasksArr.push(localTask);
      this.setState({ tasks: tasksArr});
    }
    this.setState({ loading: false });
  }

  newTask = async () => {
    this.setState({ error: "" });
    const { newTaskContent, customAddress } = this.state;
    const updates = {
      functionName: "createTask",
      value: newTaskContent
    }
    const payload = {
      abi, 
      contractAddress: customAddress ? customAddress : network === "local" ? contractAddress: ropContractAddress, 
      updates, 
      network
    }

    this.setState({ payload });
    this.estimateGas(payload);
  }

  toggleTask = (id) => {
    this.setState({ error: "" });
    const { tasks, customAddress } = this.state;
    let thisTask = tasks[id-1];
    thisTask.completed = !thisTask.completed;
    const updates = {
      functionName: "toggleCompleted",
      value: id
    }
    const payload = {
      abi, 
      contractAddress: customAddress ? customAddress : network === "local" ? contractAddress: ropContractAddress, 
      updates, 
      network
    }

    this.setState({ payload });
    this.estimateGas(payload);
  }

  approveTransaction = () => {
    this.setState({ error: "" });
    const { payload, tasks, password, contractApproval, customAddress } = this.state;
    payload.password = password;
    if(password) {
      if(contractApproval) {
        this.setState({ loading: true, showGas: false, gas: 0, contractApproval: false });
        const options = { url: 'http://localhost:5000/v1/createContract', method: 'POST', headers: headers, body: JSON.stringify(payload) };
        return request(options)
        .then(async (body) => {
          // POST succeeded...
          let contract = JSON.parse(body);
          sessionStorage.setItem('your_contract_address', contract.address);
          this.setState({ loading: false, yourContractAddress: contract.address, customAddress: contract.address });
          console.log(contract);
        })
        .catch(error => {
          // POST failed...
          console.log('ERROR: ', error)
          this.setState({ error, loading: false });
        });
      } else {
        this.setState({ newTaskContent: "", gas: 0, showGas: false, loading: true });
        const options = { url: 'http://localhost:5000/v1/sendTx', method: 'POST', headers: headers, body: JSON.stringify(payload) };
        return request(options)
        .then(async (body) => {
          if(JSON.parse(body).success === true) {
            //Setting the task locally because testnet and mainet tx take a while
            const newTask = {
              id: tasks.length + 1, 
              content: payload.updates.value, 
              complete: false
            }
            localStorage.setItem('new-task', JSON.stringify(newTask));
            tasks.push(newTask);
            localStorage.setItem('task-count', JSON.stringify(tasks.length));
            this.setState({ tasks });
          } else {
            //There was an error
            console.log(JSON.parse(body));
          }
          this.setState({ payload: {} });
          if(customAddress) {
            this.fetchContract(true);
          } else {
            this.fetchContract();
          }
          
        })
        .catch(error => {
          // POST failed...
          this.setState({ loading: false });
          console.log('ERROR: ', error);
        });
      }
    } else {
      //Password required
      this.setState({ error: "Password required" })
    }
  }

  rejectTransaction = () => {
    this.setState({ showGas: false, gas: 0, payload: {}, newTaskContent: "" });
  }

  handleChange = (e) => {
    this.setState({newTaskContent: e.target.value })
  }

  render() {
    const { error, customAddress, simpleIDContract, yourContractAddress, tasks, gas, showGas, loading, newTaskContent, password } = this.state;
    return (
      <div style={{maxWidth: "70%", margin: "auto", marginTop: "100px"}}>
        {
          loading ? 
          <div>
            <h1>Loading...</h1>
            <p>Do not refresh your page. If deploying a contract, this may take up to a few minutes.</p>
          </div> : 
          showGas ? 
          <div>
            <p>This transaction requires {gas} gas. Approve transaction?</p>
            <input type="password" id="password" value={password} onChange={this.handlePassword} placeholder="password" required />
            <button onClick={this.approveTransaction}>Approve</button>
            <button onClick={this.rejectTransaction}>Reject</button>
            <span style={{color: "red"}}>{error}</span>
          </div> : 
          <div>
            <h3>Ethereum Todo List: A Terrible Blockchain Use Case</h3>
            <h5>...but a great demonstration of SimpleID's simplicity.</h5>
            <h4>Need some ether? Get it <a href="https://faucet.ropsten.be/" target="_blank" rel="noreferrer noopener">here</a></h4>
            <p>Your Ethereum Address: <code style={{background: "#eee", padding: "3px"}}>{account1}</code></p>
            <p>SimpleID Default Contract Address: <code style={{background: "#eee", padding: "3px"}}>{simpleIDContract}</code></p>
            <p>Your Contract Address: <code style={{background: "#eee", padding: "3px"}}>{yourContractAddress ? yourContractAddress : "Fund your Ethereum Testnet (ropsten) address, and then click deploy"}</code></p>
            <p>{error}</p>
            <div><button onClick={this.deployContract}>Deploy Your Own Contract</button></div>
            <div><input type="text" value={customAddress} onChange={this.handleAddrChange} placeholder="Your contract address" /><button onClick={() => this.fetchContract(true)}>Fetch Your Contract</button></div>
            <div className="todos">
              <h3>Todo List</h3>
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
          </div>
        }
      </div>
    );
  }
}

export default App;
