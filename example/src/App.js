/* eslint-disable import/no-anonymous-default-export */
import './App.css';
import React, { useState } from 'react'
import requestInvoice from './utils/invoice'
import payInvoice from './utils/buy'

export default () => {
  const [text, setText] = useState('')
  const [buying, setBuying] = useState('')
  const [error, setError] = useState(null)
  const [invoice, setInvoice] = useState(null)
  const [bytes, setBytes] = useState(null)
  const [note, setNote] = useState('')

  const serverURL = window.location.host.startsWith('localhost')
      ? 'http://localhost:8080'
      : 'https://<todo>'

  const handleBuyHowManyChange = e => {
    setText(e.target.value)
  }

  const resetFromTop = e => {
    setError(null)
    setText('')
    setBuying('')
    setInvoice(null)
    setBytes(null)
  }

  const handleGetInvoice = async e => {
    e.preventDefault();
    try {
      if (text.length === 0) return;
      const numberOfBytes = text
      setBuying(numberOfBytes)
      setText()

      const newInvoice = await requestInvoice({
        numberOfBytes,
        config: { serverURL }
      })
      console.log('App():invoiceResult:', invoice)
      setBuying('')
      setInvoice(newInvoice)

    } catch (e) {
      console.error(e)
      if (e.response && e.response.data && e.response.data.description) {
        setError(e.response.data.description)
      } else {
        setError(e.message)
      }
    }
  }

  const handlePayInvoice = async e => {
    e.preventDefault();
    try {
    const payResult = await payInvoice({
      config: { serverURL },
      description: `Payment for ${invoice.numberOfBytes}.`,
      orderId: invoice.orderId,
      recipientPublicKey: invoice.identityKey,
      amount: invoice.amount
    })
    console.log('App():payInvoice:', payResult)
    setBytes(payResult.bytes)
    setNote(payResult.note)

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
      {buying === '' && invoice === null && error === null && (
        <form onSubmit={handleGetInvoice}>
          <label htmlFor="buy-how-many">
            How many bytes would you like to buy?
          </label>
          <input className="App-input"
            id="buy-how-many"
            onChange={handleBuyHowManyChange}
            value={text}
          />
          <button className="App-input" type="submit">Buy</button>
        </form>
      )}
      {buying !== '' && error === null && (
        <p>Buying {buying} ...</p>
      )}
      {invoice !== null && bytes === null && error === null && (
        <div>
          <p>Number of bytes: {invoice.numberOfBytes}</p>
          <p>Amount: {invoice.amount}</p>
          <button className="App-input" onClick={handlePayInvoice}>Pay Invoice</button>
        </div>
      )}
      {invoice !== null && bytes !== null && error === null && (
        <div>
          <p>Bytes: {bytes}</p>
          <button className="App-input" onClick={resetFromTop}>Reset</button>
          <p>Note: {note}</p>
        </div>
      )}
      {error !== null && (
        <div>
          <p>Error: {error}</p>
          <button className="App-input" onClick={resetFromTop}>Reset</button>
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