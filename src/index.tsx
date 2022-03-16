import { ApolloProvider } from '@apollo/client';
import ReactDOM from 'react-dom';
import App from './App';
import client from './client';
import './tailwind.css';

ReactDOM.render(
  <ApolloProvider client={client}>
    <App />
  </ApolloProvider>,
  document.getElementById('root'),
);
