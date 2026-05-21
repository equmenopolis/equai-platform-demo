"use client";

import { motion } from "framer-motion";
import { memo, useCallback } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/_components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/_components/ui/table";
import { DEMO_SCENARIOS, type DemoScenario } from "@/app/_lib/scenarios";

type Props = {
  chosenScenario: DemoScenario;
  onChangeScenario: (scenario: DemoScenario) => void;
  disabled?: boolean;
};

const Scenario = ({
  chosenScenario,
  onChangeScenario,
  disabled = false,
}: Props) => {
  const handleValueChange = useCallback(
    (value: unknown) => {
      const next = DEMO_SCENARIOS.find((s) => s.id === value);
      if (next) onChangeScenario(next);
    },
    [onChangeScenario],
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-0.5">
        <h2 className="text-2xl font-semibold">Select your scenario</h2>
        <p className="text-sm text-muted-foreground">
          Choose a scenario to practice your communication skills with our AI
          coach.
        </p>
      </div>

      <Select
        value={chosenScenario.id}
        onValueChange={handleValueChange}
        disabled={disabled}
      >
        <SelectTrigger
          aria-label="Select your scenario"
          className="w-full sm:w-80"
        >
          <SelectValue placeholder="Pick a scenario…">
            {() => chosenScenario.label}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {DEMO_SCENARIOS.map((scenario) => (
            <SelectItem key={scenario.id} value={scenario.id}>
              {scenario.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <p className="text-sm text-muted-foreground">
        {chosenScenario.description}
      </p>

      <motion.div
        transition={{ duration: 1, ease: "easeInOut" }}
        className="hidden overflow-x-auto rounded-lg border border-border sm:block"
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Scenario ID</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>{chosenScenario.label}</TableCell>
              <TableCell className="font-mono text-xs">
                {chosenScenario.id}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </motion.div>
    </div>
  );
};

export default memo(Scenario);
