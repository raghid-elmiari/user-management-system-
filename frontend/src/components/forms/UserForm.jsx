import { useState } from 'react';

export const UserForm = ({ onSubmit, initialValues = {} }) => {
  const [email, setEmail] = useState(initialValues.email || '');
  const [username, setUsername] = useState(initialValues.username || '');
  const [password, setPassword] = useState('');

  return (
    <form onSubmit={(event) => {
      event.preventDefault();
      onSubmit({ email, username, password });
    }}>
      <label>
        Email
        <input value={email} onChange={(event) => setEmail(event.target.value)} required />
      </label>
      <label>
        Username
        <input value={username} onChange={(event) => setUsername(event.target.value)} required />
      </label>
      <label>
        Password
        <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required />
      </label>
      <button type="submit">Save</button>
    </form>
  );
};
