import { useState, useEffect } from 'react';

export default function WalletConnect({ onConnect, connectedAddress }) {
    const [address, setAddress] = useState(connectedAddress || null);
    const [isConnecting, setIsConnecting] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        // 페이지 로드 시 연결 상태 확인
        checkConnection();
    }, []);

    // MetaMask 연결 상태 확인
    const checkConnection = async () => {
        if (window.ethereum) {
            try {
                const accounts = await window.ethereum.request({
                    method: 'eth_accounts'
                });
                if (accounts.length > 0) {
                    setAddress(accounts[0]);
                    if (onConnect) onConnect(accounts[0]);
                }
            } catch (err) {
                console.error('지갑 확인 실패:', err);
            }
        }
    };

    // MetaMask 연결
    const connectWallet = async () => {
        if (!window.ethereum) {
            setError('MetaMask가 설치되지 않았습니다!');
            window.open('https://metamask.io/download/', '_blank');
            return;
        }

        setIsConnecting(true);
        setError(null);

        try {
            // 계정 요청
            const accounts = await window.ethereum.request({
                method: 'eth_requestAccounts'
            });

            const walletAddress = accounts[0];
            setAddress(walletAddress);

            // 네트워크 확인 (Polygon)
            const chainId = await window.ethereum.request({
                method: 'eth_chainId'
            });

            // Polygon이 아니면 전환 요청
            if (chainId !== '0x89') { // 137 in hex
                try {
                    await window.ethereum.request({
                        method: 'wallet_switchEthereumChain',
                        params: [{ chainId: '0x89' }],
                    });
                } catch (switchError) {
                    // 네트워크가 추가되지 않은 경우 추가
                    if (switchError.code === 4902) {
                        await window.ethereum.request({
                            method: 'wallet_addEthereumChain',
                            params: [{
                                chainId: '0x89',
                                chainName: 'Polygon',
                                nativeCurrency: {
                                    name: 'MATIC',
                                    symbol: 'MATIC',
                                    decimals: 18
                                },
                                rpcUrls: ['https://polygon-rpc.com'],
                                blockExplorerUrls: ['https://polygonscan.com/']
                            }]
                        });
                    }
                }
            }

            // 콜백 호출
            if (onConnect) {
                await onConnect(walletAddress);
            }

        } catch (err) {
            console.error('지갑 연결 실패:', err);
            setError(err.message || '연결에 실패했습니다.');
        } finally {
            setIsConnecting(false);
        }
    };

    // 지갑 연결 해제
    const disconnectWallet = () => {
        setAddress(null);
        if (onConnect) onConnect(null);
    };

    // 계정 변경 감지
    useEffect(() => {
        if (window.ethereum) {
            window.ethereum.on('accountsChanged', (accounts) => {
                if (accounts.length > 0) {
                    setAddress(accounts[0]);
                    if (onConnect) onConnect(accounts[0]);
                } else {
                    setAddress(null);
                    if (onConnect) onConnect(null);
                }
            });

            window.ethereum.on('chainChanged', () => {
                window.location.reload();
            });
        }

        return () => {
            if (window.ethereum) {
                window.ethereum.removeAllListeners('accountsChanged');
                window.ethereum.removeAllListeners('chainChanged');
            }
        };
    }, [onConnect]);

    return (
        <div>
            {address ? (
                /* 연결됨 */
                <div className="flex items-center gap-3">
                    <div className="px-4 py-2 bg-green-50 border border-green-300 rounded-lg">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className="text-sm font-medium text-green-900">
                                {address.slice(0, 6)}...{address.slice(-4)}
                            </span>
                        </div>
                    </div>
                    <button
                        onClick={disconnectWallet}
                        className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-100 transition"
                    >
                        연결 해제
                    </button>
                </div>
            ) : (
                /* 연결 안됨 */
                <div>
                    <button
                        onClick={connectWallet}
                        disabled={isConnecting}
                        className="px-6 py-3 bg-gradient-to-r from-orange-500 to-purple-600 text-white rounded-lg font-bold hover:from-orange-600 hover:to-purple-700 transition shadow-lg disabled:opacity-50"
                    >
                        {isConnecting ? (
                            <span className="flex items-center gap-2">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                연결 중...
                            </span>
                        ) : (
                            <span className="flex items-center gap-2">
                                🦊 MetaMask 연결
                            </span>
                        )}
                    </button>

                    {error && (
                        <p className="mt-2 text-sm text-red-600">
                            {error}
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}
