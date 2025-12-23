"use client";

import * as React from "react";
import { motion, isMotionComponent, type HTMLMotionProps } from "motion/react";
import { cn } from "@/lib/utils";

type AnyProps = Record<string, unknown>;

type DOMMotionProps<T extends HTMLElement = HTMLElement> = Omit<
  HTMLMotionProps<keyof HTMLElementTagNameMap>,
  "ref"
> & { ref?: React.Ref<T> };

type WithAsChild<Base extends object> =
  | (Base & { asChild: true; children: React.ReactElement })
  | (Base & { asChild?: false | undefined });

type SlotProps<T extends HTMLElement = HTMLElement> = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  children?: any;
} & DOMMotionProps<T>;

function mergeRefs<T>(
  ...refs: (React.Ref<T> | undefined)[]
): React.RefCallback<T> {
  return (node) => {
    refs.forEach((ref) => {
      if (!ref) return;
      if (typeof ref === "function") {
        ref(node);
      } else {
        (ref as React.RefObject<T | null>).current = node;
      }
    });
  };
}

function mergeProps<T extends HTMLElement>(
  childProps: AnyProps,
  slotProps: DOMMotionProps<T>
): AnyProps {
  const merged: AnyProps = { ...childProps, ...slotProps };

  if (childProps.className || slotProps.className) {
    merged.className = cn(
      childProps.className as string,
      slotProps.className as string
    );
  }

  if (childProps.style || slotProps.style) {
    merged.style = {
      ...(childProps.style as React.CSSProperties),
      ...(slotProps.style as React.CSSProperties),
    };
  }

  return merged;
}

/**
 * IMPORTANT:
 * - Do NOT call motion.create() inside a React component render body.
 * - Cache motion-wrapped components at module scope so they are stable.
 */
const motionTagCache = new Map<string, React.ElementType>();
const motionTypeCache = new WeakMap<object, React.ElementType>();

function getMotionBase(childType: React.ElementType): React.ElementType {
  // Already a motion component => return as-is
  if (
    (typeof childType === "object" || typeof childType === "function") &&
    childType !== null &&
    isMotionComponent(childType as unknown as React.ElementType)
  ) {
    return childType;
  }

  // DOM tag
  if (typeof childType === "string") {
    const cached = motionTagCache.get(childType);
    if (cached) return cached;

    const created = motion.create(childType);
    motionTagCache.set(childType, created);
    return created;
  }

  // React component (function/class/object)
  if (
    typeof childType === "function" ||
    (typeof childType === "object" && childType !== null)
  ) {
    const key = childType as unknown as object;
    const cached = motionTypeCache.get(key);
    if (cached) return cached;

    const created = motion.create(childType as unknown as React.ElementType);
    motionTypeCache.set(key, created);
    return created;
  }

  // Fallback (should be rare)
  return childType;
}

function Slot<T extends HTMLElement = HTMLElement>({
  children,
  ref,
  ...props
}: SlotProps<T>) {
  // 1. Cek validitas dulu untuk logic fallback, TAPI jangan return dulu.
  const isValid = React.isValidElement(children);

  // 2. Ambil childType dengan aman. Jika tidak valid, pakai "div" sementara.
  const childType = isValid ? (children.type as React.ElementType) : "div";

  // 3. Panggil useMemo TANPA kondisi.
  // PERBAIKAN: Hapus baris kosong antara comment dan kode agar eslint-disable bekerja.
   
  const Base = React.useMemo(() => getMotionBase(childType), [childType]);

  // 4. BARU kita lakukan early return jika tidak valid.
  if (!isValid) return null;

  // Logic props (hanya jalan jika isValid true)
  const childRef = (children as unknown as { ref?: React.Ref<T> }).ref;
  const childProps = (children.props ?? {}) as AnyProps;

  const mergedProps = mergeProps(childProps, props);

  return (
    // eslint-disable-next-line react-hooks/static-components
    <Base {...mergedProps} ref={mergeRefs(childRef as React.Ref<T>, ref)} />
  );
}

export {
  Slot,
  type SlotProps,
  type WithAsChild,
  type DOMMotionProps,
  type AnyProps,
};
