import React from 'react';
import styled from 'styled-components';
import { ReactComponent as IconBackCC } from '@/ui/assets/new-user-import/back-cc.svg';
import { ReactComponent as IconDotCC } from '@/ui/assets/new-user-import/dot-cc.svg';
import clsx from 'clsx';
import { useThemeMode } from '@/ui/hooks/usePreference';

const StyedBg = styled.div<{
  isDarkTheme: boolean;
}>`
  overflow-x: auto;
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const StyledCard = styled.div`
  width: 400px;
  min-height: 520px;
  border-radius: 20px;
  background-color: var(--r-neutral-bg1, #fff);
  border: 1px solid var(--r-neutral-line, #eae7e2);
  box-shadow: 0 1px 2px rgba(26, 25, 23, 0.04),
    0 24px 64px -12px rgba(26, 25, 23, 0.14);

  html.dark & {
    box-shadow: 0 24px 64px -12px rgba(0, 0, 0, 0.6);
  }
  padding: 0px 20px 20px;
  .header {
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--r-neutral-title1, #1a1917);
    text-align: center;
    font-size: 20px;
    font-style: normal;
    font-weight: 500;
    line-height: normal;
    position: relative;
    min-height: 20px;
    .back-icon {
      position: absolute;
      left: 0;
      top: 50%;
      transform: translateY(-50%);
      cursor: pointer;
      color: var(--r-neutral-body, #4b4844);
      border-radius: 8px;
      padding: 6px;
    }
    .back-icon:hover {
      background: var(--r-neutral-card2, #f3f2ef);
    }
  }

  input.ant-input::placeholder {
    color: var(--r-neutral-foot, #827e77);
  }

  button.ant-btn.ant-btn-primary.ant-btn-loading {
    border-color: #c94a24;
    background: #c94a24;
  }
`;

const Step = ({ step }: { step: 1 | 2 }) => {
  return (
    <div className="flex items-center justify-center gap-4">
      <IconDotCC className="text-rabby-blue-default" viewBox="0 0 8 8" />
      <div
        className={clsx(
          'w-[16px] h-[1px]',
          step === 2 ? 'bg-rabby-blue-default' : 'bg-rabby-blue-light2'
        )}
      />
      <IconDotCC
        className={clsx(
          step === 2 ? 'text-rabby-blue-default' : 'text-rabby-blue-light2'
        )}
        viewBox="0 0 8 8"
      />
    </div>
  );
};

export const Card = ({
  title,
  step,
  children,
  onBack,
  className,
  headerClassName,
  headerBlock,
  cardStyle,
}: React.PropsWithChildren<{
  title?: React.ReactNode;
  step?: 1 | 2;
  onBack?: () => void;
  className?: string;
  headerClassName?: string;
  headerBlock?: boolean;
  cardStyle?: React.CSSProperties;
}>) => {
  const { isDarkTheme } = useThemeMode();

  return (
    <StyedBg isDarkTheme={isDarkTheme} className="crabble-atmosphere">
      <StyledCard className={className} style={cardStyle}>
        <div
          className={clsx(
            headerBlock ? 'block' : !onBack && !title && !step && 'hidden',
            'header',
            headerClassName,
            step && 'mt-18',
            title && 'mt-[14px]',
            !step && !title && onBack && 'mt-18'
          )}
        >
          {!!onBack && (
            <div className="back-icon" onClick={onBack}>
              <IconBackCC
                className="w-20 h-20 text-r-neutral-body"
                viewBox="0 0 20 20"
              />
            </div>
          )}
          {title ? <div>{title}</div> : step ? <Step step={step} /> : null}
        </div>
        {children}
      </StyledCard>
    </StyedBg>
  );
};
