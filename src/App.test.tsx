import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';
import { STORAGE_KEYS } from './utils/persistedState';

function stubFetch() {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string) => {
      if (url === '/api/config') {
        return { ok: true, json: async () => ({ envKeys: { anthropic: false, google: false } }) };
      }
      return { ok: true, json: async () => ({ code: 'const A = () => <div>ok</div>;\nrender(<A />);' }) };
    }),
  );
}

describe('App 상태 영속화', () => {
  beforeEach(stubFetch);
  afterEach(() => vi.unstubAllGlobals());

  it('선택한 Provider가 새로고침 후에도 유지된다', async () => {
    const user = userEvent.setup();
    const first = render(<App />);
    await user.selectOptions(screen.getByLabelText('Provider'), 'anthropic');
    first.unmount();

    render(<App />);
    expect(screen.getByLabelText('Provider')).toHaveValue('anthropic');
  });

  it('입력한 API 키가 새로고침 후에도 유지된다', async () => {
    const user = userEvent.setup();
    const first = render(<App />);
    await user.type(screen.getByLabelText('API Key'), 'dummy-key-1');
    first.unmount();

    render(<App />);
    expect(screen.getByLabelText('API Key')).toHaveValue('dummy-key-1');
  });

  it('API 키는 Provider별로 따로 저장된다', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.type(screen.getByLabelText('API Key'), 'google-dummy');
    await user.selectOptions(screen.getByLabelText('Provider'), 'anthropic');
    expect(screen.getByLabelText('API Key')).toHaveValue('');

    await user.type(screen.getByLabelText('API Key'), 'anthropic-dummy');
    await user.selectOptions(screen.getByLabelText('Provider'), 'google');
    expect(screen.getByLabelText('API Key')).toHaveValue('google-dummy');
  });

  it('저장된 프롬프트 히스토리를 최근 프롬프트로 보여준다', () => {
    localStorage.setItem(STORAGE_KEYS.promptHistory, JSON.stringify(['저장된 프롬프트']));
    render(<App />);
    expect(screen.getByRole('button', { name: '저장된 프롬프트' })).toBeInTheDocument();
  });

  it('생성하면 프롬프트가 히스토리에 쌓이고 새로고침 후에도 남는다', async () => {
    const user = userEvent.setup();
    localStorage.setItem(STORAGE_KEYS.apiKeys, JSON.stringify({ google: 'dummy' }));
    const first = render(<App />);

    await user.type(screen.getByRole('textbox'), '새 프롬프트');
    await user.click(screen.getByRole('button', { name: '컴포넌트 생성' }));
    expect(await screen.findByRole('heading', { name: '생성된 컴포넌트' })).toBeInTheDocument();
    first.unmount();

    render(<App />);
    expect(screen.getByRole('button', { name: '새 프롬프트' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '생성된 컴포넌트' })).toBeInTheDocument();
  });

  it('기록 삭제를 누르면 히스토리가 비워진다', async () => {
    const user = userEvent.setup();
    localStorage.setItem(STORAGE_KEYS.promptHistory, JSON.stringify(['지울 프롬프트']));
    render(<App />);

    await user.click(screen.getByRole('button', { name: '기록 삭제' }));
    expect(screen.queryByRole('button', { name: '지울 프롬프트' })).not.toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem(STORAGE_KEYS.promptHistory) ?? 'null')).toEqual([]);
  });
});
