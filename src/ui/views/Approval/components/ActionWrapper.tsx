import clsx from 'clsx';
import React from 'react';
import styled from 'styled-components';

export const DIV = styled.div`
  .action-header {
    display: flex;
    justify-content: space-between;
    padding: 12px 16px;
    align-items: center;
    color: var(--r-neutral-title1, #09090b);
    border-top-left-radius: 12px;
    border-top-right-radius: 12px;

    .left {
      font-weight: 500;
      font-size: 16px;
      line-height: 18px;
      display: flex;
      align-items: center;
      position: relative;
    }
    .right {
      font-size: 14px;
      line-height: 16px;
      position: relative;
    }

    .decode-tooltip {
      max-width: 360px;
      &:not(.ant-tooltip-hidden) {
        left: -17px !important;
        .ant-tooltip-arrow {
          left: 212px;
        }
      }
      .ant-tooltip-arrow-content {
        background-color: var(--r-neutral-bg-1, #fff);
      }
      .ant-tooltip-inner {
        background-color: var(--r-neutral-bg-1, #fff);
        padding: 0;
        font-size: 13px;
        font-weight: 500;
        color: var(--r-neutral-body, #3f3f46);
        border-radius: 8px;
      }
    }
    &.is-unknown {
      .left {
        color: var(--r-neutral-foot, #71717a);
      }
    }
  }
  .container {
    padding: 0 16px 0;

    &:empty {
      padding: 0;
    }

    .header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 16px;
      .left {
        font-weight: 500;
        font-size: 16px;
        line-height: 19px;
        color: #222222;
      }
      .right {
        font-size: 14px;
        line-height: 16px;
        color: #999999;
      }
    }
  }
`;

export const ActionWrapper: React.FC<{
  isEmptyBody?: boolean;
  children?: React.ReactNode;
}> = ({ children, isEmptyBody }) => {
  return (
    <DIV>
      <div className={clsx('space-y-12')}>{children}</div>
    </DIV>
  );
};
