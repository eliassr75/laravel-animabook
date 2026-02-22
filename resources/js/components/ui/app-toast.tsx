import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function AppToast() {
  return (
    <ToastContainer
      position="top-right"
      autoClose={2800}
      newestOnTop
      closeOnClick
      pauseOnHover
      draggable
      theme="light"
      limit={4}
      className="ab-toast-container"
      toastClassName="ab-toast"
      progressClassName="ab-toast-progress"
    />
  );
}
