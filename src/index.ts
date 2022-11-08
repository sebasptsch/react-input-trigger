import React, { useCallback, useState } from "react";
import getCaretCoordinates from "textarea-caret";
// InputTrigger.propTypes = {
//   trigger: PropTypes.shape({
//     keyCode: PropTypes.number,
//     shiftKey: PropTypes.bool,
//     ctrlKey: PropTypes.bool,
//     metaKey: PropTypes.bool,
//   }),
//   onStart: PropTypes.func,
//   onCancel: PropTypes.func,
//   onType: PropTypes.func,
//   endTrigger: PropTypes.func,
//   children: PropTypes.element.isRequired,
//   elementRef: PropTypes.element,
// };

// InputTrigger.defaultProps = {
//   trigger: {
//     keyCode: null,
//     shiftKey: false,
//     ctrlKey: false,
//     metaKey: false,
//   },
//   onStart: () => {},
//   onCancel: () => {},
//   onType: () => {},
//   endTrigger: () => {},
//   elementRef: null,
// };

interface HookReturnType {
  hookType: "cancel" | "typing" | "start";
  cursor: {
    selectionStart: number;
    selectionEnd: number;
    top: number;
    left: number;
    height: number;
  };

  text?: string;
}

interface Props {
  trigger: {
    keyCode: number;
    shiftKey?: boolean;
    ctrlKey?: boolean;
    metaKey?: boolean;
  };
  onStart?: (hookObject: HookReturnType) => void;
  onCancel?: (hookObject: HookReturnType) => void;
  onType?: (hookObject: HookReturnType) => void;
  endTrigger?: (resetState: () => void) => void;
  ref: React.MutableRefObject<HTMLTextAreaElement | null>;
}

const getHookObject = (
  type: "cancel" | "typing" | "start",
  element: HTMLTextAreaElement,
  startPoint?: number
) => {
  const caret = getCaretCoordinates(element, element.selectionEnd);

  const result: HookReturnType = {
    hookType: type,
    cursor: {
      selectionStart: element.selectionStart,
      selectionEnd: element.selectionEnd,
      top: caret.top,
      left: caret.left,
      height: caret.height,
    },
    text: undefined,
  };

  if (!startPoint) {
    return result;
  }

  result.text = element.value.substr(startPoint, element.selectionStart);

  return result;
};

const useInputTrigger = ({ ref, ...props }: Props) => {
  const [triggered, setTriggered] = useState<boolean>(false);
  const [triggerStartPosition, setTriggerStartPosition] = useState<
    number | undefined
  >();

  const resetState = useCallback(() => {
    setTriggered(false);
    setTriggerStartPosition(undefined);
  }, []);

  const handleTrigger = useCallback(
    (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (!ref.current) {
        return;
      }
      const { trigger, onStart, onCancel, onType } = props;

      const { which, shiftKey, metaKey, ctrlKey } = event;

      const { selectionStart } = event.currentTarget;

      if (!triggered) {
        if (
          which === trigger.keyCode &&
          shiftKey === !!trigger.shiftKey &&
          ctrlKey === !!trigger.ctrlKey &&
          metaKey === !!trigger.metaKey
        ) {
          setTriggered(true);
          setTriggerStartPosition(selectionStart + 1);
          setTimeout(() => {
            onStart && onStart(getHookObject("start", ref.current!));
          }, 0);
          return null;
        }
      } else {
        if (
          which === 8 &&
          (triggerStartPosition === undefined ||
            selectionStart <= triggerStartPosition)
        ) {
          setTriggered(false);
          setTriggerStartPosition(undefined);
          setTimeout(() => {
            onCancel && onCancel(getHookObject("cancel", ref.current!));
          }, 0);
        }

        setTimeout(() => {
          onType &&
            onType(getHookObject("typing", ref.current!, triggerStartPosition));
        }, 0);
      }

      return null;
    },
    [triggered, triggerStartPosition]
  );

  return { handleTrigger, resetState };
};

// return <textarea onKeyDown={(e) => {e.currentTarget.selection}}></textarea>;

export default useInputTrigger;
