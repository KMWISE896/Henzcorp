import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';

const DepositButton = () => {
  return (
    <Link to="/deposit">
      <div className="text-center cursor-pointer">
        <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-2 hover:bg-blue-600 transition-colors">
          <Plus className="w-6 h-6 text-white" />
        </div>
        <p className="text-white text-sm">Deposit</p>
      </div>
    </Link>
  );
};

export default DepositButton;
