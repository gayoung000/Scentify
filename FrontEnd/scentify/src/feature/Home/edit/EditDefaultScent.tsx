import React, { useState, useEffect, useCallback, useRef } from 'react';
import SpaceTab from '../defaultscent/SpaceTab';
import SpaceDescription from '../defaultscent/SpaceDescription';
import { useControlStore } from '../../../stores/useControlStore';
import { useLocation, useNavigate } from 'react-router-dom';
import { editCapsuleAndDefaultScent } from '../../../apis/home/editCapsuleAndDefaultScent';
import { editCapsule } from '../../../apis/home/editCapsule';
import { fragranceMap } from '../capsule/utils/fragranceMap';
import Alert from '../../../components/Alert/Alert';

interface FormData {
  roomType: 'small' | 'large' | null;
  scentNames: {
    slot1: string;
    slot2: string;
    slot3: string;
    slot4: string;
  };
  scentCnt: {
    slot1: number;
    slot2: number;
    slot3: number;
    slot4: number;
  };
}

interface Message {
  type: 'error' | 'success';
  text: string;
}

function EditDefaultScent() {
  const navigate = useNavigate();
  const location = useLocation();
  const { deviceId, capsuleData, name, defaultCombination } =
    location.state || {};
  const { setCompleteHandler } = useControlStore();
  const [message, setMessage] = useState<Message | null>(null);
  const [showAlert, setShowAlert] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    message: '',
    onConfirm: () => {},
    showButtons: true,
  });

  const slot1 = capsuleData?.slot1;
  const slot2 = capsuleData?.slot2;
  const slot3 = capsuleData?.slot3;
  const slot4 = capsuleData?.slot4;

  // ✅ 공간 크기 상태 추가
  const [roomType, setRoomType] = useState<'small' | 'large' | null>(null);

  // ✅ 이전 `capsuleData` 저장 (리렌더링 방지)
  // const prevCapsuleData = useRef(capsuleData);

  // ✅ 향 슬롯이 변하지 않도록 고정
  // scentNames를 문자열로 변환
  const [scentNames] = useState({
    slot1: fragranceMap[slot1],
    slot2: fragranceMap[slot2],
    slot3: fragranceMap[slot3],
    slot4: fragranceMap[slot4],
  });

  // ✅ 향 사용량을 설정하는 상태 (초기 상태에서 `totalEnergy`를 넘지 않도록 보정)
  const [scentCnt, setScentCnt] = useState(() => {
    return {
      slot1: 0,
      slot2: 0,
      slot3: 0,
      slot4: 0,
    };
  });

  const handleComplete = useCallback(async () => {
    if (!roomType) {
      setAlertConfig({
        message: '공간 크기를 선택해주세요.',
        onConfirm: () => setShowAlert(false),
        showButtons: true,
      });
      setShowAlert(true);
      return;
    }

    // 향 설정 검증
    const totalUsage = Object.values(scentCnt).reduce(
      (acc, curr) => acc + curr,
      0
    );
    if (totalUsage === 0) {
      setAlertConfig({
        message: '향을 하나 이상 설정해주세요.',
        onConfirm: () => setShowAlert(false),
        showButtons: true,
      });
      setShowAlert(true);
      return;
    }

    const roomTypeValue = roomType === 'small' ? 0 : 1;

    try {
      // 1. 캡슐 정보 수정
      await editCapsule(
        deviceId,
        capsuleData.name,
        capsuleData.slot1,
        capsuleData.slot2,
        capsuleData.slot3,
        capsuleData.slot4
      );

      // 2. 기본향 설정 수정 (올바른 구조로 변환)
      const combination = {
        choice1: Number(slot1) || 0,
        choice1Count: Number(scentCnt.slot1) || 0,
        choice2: Number(slot2) || 0,
        choice2Count: Number(scentCnt.slot2) || 0,
        choice3: Number(slot3) || 0,
        choice3Count: Number(scentCnt.slot3) || 0,
        choice4: Number(slot4) || 0,
        choice4Count: Number(scentCnt.slot4) || 0,
      };

      // 2. 기본향 설정 수정
      await editCapsuleAndDefaultScent(deviceId, roomTypeValue, combination);
      console.log('🍀 캡슐-기본향 combination', combination);

      setAlertConfig({
        message: '기본향 설정이 완료되었습니다.',
        onConfirm: () => {
          setShowAlert(false);
          navigate('/home');
        },
        showButtons: true,
      });
      setShowAlert(true);
    } catch (error) {
      console.error('수정 실패:', error);
      setAlertConfig({
        message: '수정 중 오류가 발생했습니다.',
        onConfirm: () => setShowAlert(false),
        showButtons: true,
      });
      setShowAlert(true);
    }
  }, [
    deviceId,
    capsuleData,
    name,
    defaultCombination,
    navigate,
    roomType,
    slot1,
    slot2,
    slot3,
    slot4,
    scentCnt,
  ]);

  useEffect(() => {
    if (!deviceId) return;
    setCompleteHandler(handleComplete);

    return () => {
      setCompleteHandler(null);
    };
  }, [deviceId, handleComplete]);

  return (
    <>
      <div className="flex flex-col items-center pt-5">
        <SpaceTab
          setRoomType={setRoomType}
          roomType={roomType}
          scentCnt={scentCnt}
          setScentCnt={setScentCnt}
          scentNames={scentNames}
        />

        <div className="w-[300px] ">
          {!roomType && (
            <p className="text-red-500 text-12 font-pre-light self-start">
              공간 크기를 먼저 선택해주세요.
            </p>
          )}
        </div>
        <div className="mt-4">
          <SpaceDescription />
        </div>
      </div>
      {showAlert && (
        <Alert
          message={alertConfig.message}
          onClose={() => setShowAlert(false)}
          onConfirm={alertConfig.onConfirm}
          showButtons={alertConfig.showButtons}
          confirmText="확인"
          cancelText=""
        />
      )}
    </>
  );
}

export default EditDefaultScent;
