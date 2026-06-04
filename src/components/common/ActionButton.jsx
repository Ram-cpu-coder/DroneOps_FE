<<<<<<< HEAD
import { LoaderCircle } from "lucide-react";

const ActionButton = ({
  children,
  icon: Icon,
  iconPosition = "start",
  isLoading = false,
  variant = "secondary",
  type = "button",
  onClick,
  ...buttonProps
}) => {
  const ButtonIcon = isLoading ? LoaderCircle : Icon;

  return (
    <button
      className={`${variant}-button${isLoading ? " is-loading" : ""}`}
      type={type}
      onClick={onClick}
      aria-busy={isLoading}
      {...buttonProps}
    >
      {ButtonIcon && iconPosition === "start" && <ButtonIcon className={isLoading ? "button-spinner" : undefined} size={17} />}
      {children}
      {ButtonIcon && iconPosition === "end" && <ButtonIcon className={isLoading ? "button-spinner" : undefined} size={17} />}
=======
const ActionButton = ({ children, icon: Icon, iconPosition = "start", variant = "secondary", type = "button", onClick }) => {
  return (
    <button className={`${variant}-button`} type={type} onClick={onClick}>
      {Icon && iconPosition === "start" && <Icon size={17} />}
      {children}
      {Icon && iconPosition === "end" && <Icon size={17} />}
>>>>>>> a42502c6d700f2717489ee870fd450c6431788f9
    </button>
  );
};

export default ActionButton;
