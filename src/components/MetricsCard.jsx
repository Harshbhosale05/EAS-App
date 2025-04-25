import React from 'react';
import PropTypes from 'prop-types';
import { ArrowUp, ArrowDown } from 'lucide-react';

function MetricsCard({ title, value, icon, trend, className = '' }) {
  return (
    <div className={`rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-gray-400">{title}</span>
        {icon}
      </div>
      <div className="flex items-end justify-between">
        <span className="text-2xl font-bold">{value}</span>
        <div className={`flex items-center ${trend > 0 ? 'text-green-500' : 'text-red-500'}`}>
          {trend > 0 ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
          <span className="ml-1 text-sm">{Math.abs(trend)}%</span>
        </div>
      </div>
    </div>
  );
}

MetricsCard.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.number.isRequired,
  icon: PropTypes.node.isRequired,
  trend: PropTypes.number.isRequired,
  className: PropTypes.string
};

export default MetricsCard;
