/* eslint-disable import/no-anonymous-default-export */
import './App.css';
import React, { useState } from 'react'
import invoice from './utils/invoice'

export default () => {
  const [text, setText] = useState('')
  const [buying, setBuying] = useState('')
  const [error, setError] = useState(null)

  const serverURL = window.location.host.startsWith('localhost')
      ? 'http://192.168.0.202:8080'
      : 'https://<todo>'

  const handleBuyHowManyChange = e => {
    setText(e.target.value)
  }

  const resetFromError = e => {
    setText('')
    setBuying('')
    setError(null)
  }

  const handleGetInvoice = async e => {
    e.preventDefault();
    try {
      if (text.length === 0) return;
      const numberOfBytes = text
      setBuying(numberOfBytes)
      setText()

      const invoiceResult = await invoice({
        numberOfBytes,
        config: {
          serverURL
        }
      })
      console.log('App():invoiceResult:', invoiceResult)
    } catch (e) {
      console.error(e)
      if (e.response && e.response.data && e.response.data.description) {
        setError(e.response.data.description)
      } else {
        setError(e.message)
      }
    }
  }

  return (
      <div className="App">
        <header className="App-header">
      {buying === '' && (
        <form onSubmit={handleGetInvoice}>
          <label htmlFor="buy-how-many">
            How many bytes would you like to buy?
          </label>
          <input className="App-input"
            id="buy-how-many"
            onChange={handleBuyHowManyChange}
            value={text}
          />
        </form>
      )}
      {buying !== '' && (
        <p>Buying {buying}</p>
      )}
      {error !== null && (
        <div>
          <p>Error: {error}</p>
          <button onClick={resetFromError}>Reset</button>
        </div>
      )}
      </header>
    </div>
  )
}

/*
          <input type='button' onClick={resetFromError}>Reset</input>
          <Button onPress={resetFromError} title='Reset' />

class BuyBytes extends React.Component {
  constructor(props) {
      super(props);
      this.state = { buying: '', text: ''};
      this.handleChange = this.handleChange.bind(this);
      this.handleSubmit = this.handleSubmit.bind(this);
  }

  GetBuyQuantityForm() {
    return (
      <div>
        <form onSubmit={this.handleSubmit}>
          <label htmlFor="buy-how-many">
            How many bytes would you like to buy?
          </label>
          <input className="App-input"
            id="buy-how-many"
            onChange={this.handleChange}
            value={this.state.text}
          />
        </form>
      </div>
    );
  }

  render() {
    if (this.state.buying === '') {
      return this.GetBuyQuantityForm()
    } else {
      return (
        <p>Buying {this.state.buying}</p>
      );
    }
  }

  handleChange(e) {
    this.setState({ text: e.target.value })
  }

  async handleSubmit(e) {
    e.preventDefault();
    if (this.state.text.length === 0) return;
    this.setState(state => ({
      text: '',
      buying: state.text
    }))
    const invoiceResult = await invoice({
      numberOfBytes: this.state.buying
    })
  }
}

class App extends React.Component {
  render() {
    return (
      <div className="App">
        <header className="App-header">
          <BuyBytes />
        </header>
      </div>
    );
  }
}

export default App;
*/