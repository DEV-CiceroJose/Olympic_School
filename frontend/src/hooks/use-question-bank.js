import { useEffect, useState } from "react";
import { questionRepository } from "@/services/question-repository";

export function useQuestionBank() {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    questionRepository
      .list()
      .then((items) => {
        if (active) setQuestions(items);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return { questions, loading };
}
