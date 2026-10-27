import { TokenWithChain } from '@/ui/component';
import React from 'react';
import styled from 'styled-components';
import { TokenItem } from '@rabby-wallet/rabby-api/dist/types';
import { getTokenSymbol } from '@/ui/utils/token';
import { useTranslation } from 'react-i18next';
import { ChevronDown } from 'lucide-react';

const TokenRenderWrapper = styled.div`
  width: auto;
  height: 40px;
  display: flex;
  align-items: center;
  padding: 0 10px 0 6px;
  border-radius: 999px;
  background: var(--crb-sunken);
  box-shadow: inset 0 0 0 1px var(--crb-hairline);
  font-weight: 600;
  font-size: 16px;
  letter-spacing: -0.01em;
  cursor: pointer;
  transition: background-color 0.15s var(--crb-ease);
  &:hover {
    background: var(--crb-sunken-hover);
  }
  &:active {
    background: var(--crb-press);
  }
  .token {
    display: flex;
    flex: 1;
    gap: 8px;
    align-items: center;

    .text {
      color: var(--r-neutral-title-1);
      max-width: 72px;
      display: inline-block;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }
  .select {
    color: var(--r-neutral-title-1);
    flex: 1;
    gap: 6px;
    padding-left: 6px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    white-space: nowrap;
  }
  .arrow {
    margin-left: auto;
    flex-shrink: 0;
    color: var(--r-neutral-foot);
  }
`;
export const TokenRender = ({
  openTokenModal,
  token,
  type = 'swap',
}: {
  token?: TokenItem | undefined;
  openTokenModal: () => void;
  type?: 'swap' | 'bridge';
}) => {
  const { t } = useTranslation();

  return (
    <TokenRenderWrapper onClick={openTokenModal}>
      {token ? (
        <div className="token">
          <TokenWithChain
            width="28px"
            height="28px"
            token={token}
            hideConer
            hideChainIcon
          />
          <span className="text" title={getTokenSymbol(token)}>
            {getTokenSymbol(token)}
          </span>
          <ChevronDown size={16} strokeWidth={2.25} className="arrow" />
        </div>
      ) : (
        <div className="select">
          <span>{t('page.swap.select-token')}</span>
          <ChevronDown size={16} strokeWidth={2.25} className="arrow" />
        </div>
      )}
    </TokenRenderWrapper>
  );
};
