import { AiOutlineLoading } from 'react-icons/ai'
import { useLoading } from './useLoading'

export const LoadingIndicator = () => {
  const state = useLoading()
  return (
    <div className={`loading ${state.value ? '' : 'hidden'}`}>
      <AiOutlineLoading size="36" color="#666666" className="spin" />
    </div>
    )
  }