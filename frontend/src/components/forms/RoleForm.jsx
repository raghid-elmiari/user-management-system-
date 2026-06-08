import { useState } from 'react';

export const RoleForm = ({ onSubmit, initialValues = {} }) => {
  const [name, setName] = useState(initialValues.name || '');
  const [description, setDescription] = useState(initialValues.description || '');

  return (
    <form onSubmit={(event) => {
      event.preventDefault();
      onSubmit({ name, description });
    }}>
      <label>
        Role name
        <input value={name} onChange={(event) => setName(event.target.value)} required />
      </label>
      <label>
        Description
        <textarea value={description} onChange={(event) => setDescription(event.target.value)} />
      </label>
      <button type="submit">Save Role</button>
    </form>
  );
};
