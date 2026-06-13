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
        <input value={resource} onChange={(e) => setResource(e.target.value)} required />
      </label>

      <label>
        Action
        <input value={action} onChange={(e) => setAction(e.target.value)} required />
      </label>

      <label>
        Description
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} />
      </label>

      <button type="submit">Save Permission</button>
    </form>
  );
};