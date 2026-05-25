const ActionButton = ({ children, icon: Icon, iconPosition = "start", variant = "secondary", type = "button", onClick }) => {
  return (
    <button className={`${variant}-button`} type={type} onClick={onClick}>
      {Icon && iconPosition === "start" && <Icon size={17} />}
      {children}
      {Icon && iconPosition === "end" && <Icon size={17} />}
    </button>
  );
};

export default ActionButton;
