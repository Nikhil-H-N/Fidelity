from typing import List, Dict
import time

class TemporalEngine:
    """Section 45: Behavior timing matters."""
    
    @staticmethod
    def analyze_timing(events: List[Dict]) -> Dict:
        if len(events) < 2:
            return {
                "avg_click_interval": 0,
                "click_velocity": "STABLE",
                "reading_depth": "LOW",
                "total_dwell_time": sum([(e.get('dwell_time') or 0) for e in events]),
                "hesitation_pause_detected": False,
                "scroll_velocity": "STABLE",
                "hover_tendency": "NONE",
                "night_browsing": False,
                "weekend_browsing": False
            }
            
        # Click Timing Analysis
        # Fast clicks (confusion/frustration) vs Slow deliberate clicks (serious interest)
        clicks = [e for e in events if e['event_type'] in ['click', 'cta_click', 'rage_click']]
        click_intervals = []
        if len(clicks) >= 2:
            for i in range(1, len(clicks)):
                click_intervals.append(clicks[i]['timestamp'] - clicks[i-1]['timestamp'])
        
        avg_click_interval = sum(click_intervals) / len(click_intervals) if click_intervals else 5.0
        
        click_velocity = "STABLE"
        if avg_click_interval < 0.5: click_velocity = "VOLATILE_FAST"
        elif avg_click_interval > 3.0: click_velocity = "DELIBERATE"
        
        # Reading Time Analysis
        # Very short (skimming), Medium (interest), Long (research)
        dwell_times = [e.get('dwell_time', 0) for e in events if e['event_type'] == 'page_visit']
        total_dwell = sum(dwell_times)
        
        reading_depth = "LOW"
        if total_dwell > 420: reading_depth = "RESEARCH"
        elif total_dwell > 180: reading_depth = "INTEREST"
        elif total_dwell > 45: reading_depth = "SKIMMING"
        
        # Pause Analysis (Section 45)
        # Long pause before CTA = Hesitation
        last_cta = next((e for e in reversed(events) if e['event_type'] == 'cta_click'), None)
        hesitation_pause = False
        if last_cta:
            # Find event before last_cta
            idx = events.index(last_cta)
            if idx > 0:
                prev_event = events[idx-1]
                pause = last_cta['timestamp'] - prev_event['timestamp']
                if pause > 10.0: # 10 second pause before CTA
                    hesitation_pause = True

        # Scroll Velocity (Section 30)
        scroll_velocity = TemporalEngine.analyze_scroll_velocity(events)

        # Hover Analysis (Section 30)
        hover_tendency = TemporalEngine.analyze_hovers(events)

        # Temporal Context (Section 45: Night/Weekend)
        last_ts = events[-1]['timestamp']
        struct_time = time.localtime(last_ts)
        is_night = struct_time.tm_hour >= 23 or struct_time.tm_hour < 5
        is_weekend = struct_time.tm_wday >= 5 # 5=Sat, 6=Sun

        return {
            "avg_click_interval": avg_click_interval,
            "click_velocity": click_velocity,
            "reading_depth": reading_depth,
            "total_dwell_time": total_dwell,
            "hesitation_pause_detected": hesitation_pause,
            "scroll_velocity": scroll_velocity,
            "hover_tendency": hover_tendency,
            "night_browsing": is_night,
            "weekend_browsing": is_weekend
        }

    @staticmethod
    def analyze_scroll_velocity(events: List[Dict]) -> str:
        """Section 30: Fast scroll (Scanning) vs Slow scroll (Reading)."""
        scroll_events = [e for e in events if e['event_type'] == 'scroll' or (e.get('scroll_depth', 0) > 0)]
        if len(scroll_events) < 2: return "STABLE"
        
        velocities = []
        for i in range(1, len(scroll_events)):
            d_depth = abs(scroll_events[i].get('scroll_depth', 0) - scroll_events[i-1].get('scroll_depth', 0))
            d_time = scroll_events[i]['timestamp'] - scroll_events[i-1]['timestamp']
            if d_time > 0.1: # Avoid noise
                velocities.append(d_depth / d_time)
        
        if not velocities: return "STABLE"
        avg_v = sum(velocities) / len(velocities)
        if avg_v > 50: return "FAST_SCANNING"
        if avg_v < 10: return "SLOW_READING"
        return "STABLE"

    @staticmethod
    def analyze_hovers(events: List[Dict]) -> str:
        """Section 30: Short hover (Curiosity) vs Long hover (Consideration)."""
        hovers = [e for e in events if e['event_type'] == 'cta_hover']
        if not hovers: return "NONE"
        
        avg_duration = sum([e.get('dwell_time', 0) for e in hovers]) / len(hovers)
        if avg_duration > 3.0: return "LONG_CONSIDERATION"
        if len(hovers) >= 3: return "REPEATED_HESITATION"
        return "CURIOSITY"
