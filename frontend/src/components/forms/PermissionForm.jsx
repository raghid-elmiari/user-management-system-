import { useState } from 'react';

export const PermissionForm = ({ onSubmit, initialValues = {} }) => {
  const [resource, setResource] = useState(initialValues.resource || '');
  const [action, setAction] = useState(initialValues.action || '');
  const [description, setDescription] = useState(initialValues.description || '');

  return (
    <form onSubmit={(event) => {
      event.preventDefault();
      onSubmit({ resource, action, description });
    }}>
      <label>
        Resource
        <input value={resource} onChange={(event) => setResource(event.target.value)} required />
      </label>
      <label>
        Action
        <input value={action} onChange={(event) => setAction(event.target.value)} required />
      </label>
      <label>
        Description
        <textarea value={description} onChange={(event) => setDescription(event.target.value)} />
      </label>
      <button type="submit">Save Permission</button>
    </form>
  );
};
