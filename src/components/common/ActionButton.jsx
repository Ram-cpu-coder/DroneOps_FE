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
    </button>
  );
};

export default ActionButton;
