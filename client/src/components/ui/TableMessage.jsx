function TableMessage({ children }) {
  return (
    <tr>
      <td className="whitespace-normal px-table-x py-8 text-center text-empty-state-text" colSpan="5">
        {children}
      </td>
    </tr>
  );
}

export default TableMessage;
