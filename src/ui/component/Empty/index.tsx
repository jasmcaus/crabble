import clsx from 'clsx';
import { Inbox } from 'lucide-react';
import React, { ReactNode } from 'react';
import './style.less';

interface EmptyProps {
  className?: string;
  style?: React.CSSProperties;
  children?: ReactNode;
  title?: ReactNode;
  desc?: ReactNode;
}

const Empty = ({ className, style, children, title, desc }: EmptyProps) => {
  return (
    <div className={clsx('rabby-empty', className)} style={style}>
      <div className="rabby-empty-image" aria-hidden>
        <Inbox size={22} strokeWidth={1.75} />
      </div>
      <div className="rabby-empty-content">
        {title && <div className="rabby-empty-title">{title}</div>}
        <div className="rabby-empty-desc">{children ? children : desc}</div>
      </div>
    </div>
  );
};

export default Empty;
