import { useEffect, useRef, useState } from 'react';

export interface StreamingChunk {
  key: number;
  text: string;
}

// content가 이전 값에 이어붙는 형태(append)인지 확인해, 새로 도착한 부분만 별도 청크로 분리한다.
// delta.replace 등으로 내용이 통째로 바뀌면 전체를 새 청크 하나로 취급한다.
export function useStreamingChunks(content: string, isStreaming: boolean): StreamingChunk[] {
  const [chunks, setChunks] = useState<StreamingChunk[]>([]);
  const prevContentRef = useRef('');
  const nextKeyRef = useRef(0);

  useEffect(() => {
    if (!isStreaming) {
      return;
    }
    const prevContent = prevContentRef.current;
    if (content === prevContent) {
      return;
    }

    const isAppend = content.startsWith(prevContent);
    const newText = isAppend ? content.slice(prevContent.length) : content;

    setChunks((current) => {
      const next = isAppend ? current : [];
      return newText ? [...next, { key: nextKeyRef.current++, text: newText }] : next;
    });
    prevContentRef.current = content;
  }, [content, isStreaming]);

  if (!isStreaming) {
    return [{ key: -1, text: content }];
  }
  return chunks;
}
