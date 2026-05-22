const ActionButton = ({ children, icon: Icon, variant = "secondary", type = "button", onClick }) => {
  return (
    <button className={`${variant}-button`} type={type} onClick={onClick}>
      {Icon && <Icon size={17} />}
      {children}
    </button>
  );
};

export default ActionButton;
